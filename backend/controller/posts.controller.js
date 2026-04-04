import prisma from '../lib/prisma.js';
import { getFileInfo } from '../middleware/upload.middleware.js';
import SystemLogger from '../utils/systemLogger.js';
import { getIO } from '../utils/realtime.js';
import { asyncHandler, AppError, NotFoundError } from '../utils/errors.js';

const MAX_CONTENT_BYTES = Number(process.env.POST_CONTENT_MAX_BYTES || 200 * 1024); // 200 kb max payload

/**
 * @fileoverview
 * API handlers for posts, likes, and comments.
 *
 * Notes:
 * - Some endpoints are admin-only (e.g., create/pin) and enforced at the router level.
 * - This controller emits Socket.IO events (e.g. `post_created`, `comment_added`).
 * - `POST_CONTENT_MAX_BYTES` limits post content size to prevent oversized payloads.
 */

// Simple in-memory set to track view increments per session/user/post
const viewedPosts = new Map(); // key: `${userId||ip}_${postId}`, value: timestamp

/**
 * Clean up old view tracking entries every 30 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewedPosts) {
    if (now - timestamp > 30 * 60 * 1000) {
      viewedPosts.delete(key);
    }
  }
}, 30 * 60 * 1000);

// Shared includes used across multiple endpoints
const POST_INCLUDE = {
  author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } },
  postLikes: { select: { user_id: true } },
  comments: { select: { id: true } }
};

/**
 * Parses media_urls from multipart or JSON body.
 */
function resolveMediaUrls(req, body) {
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    return req.files.map(f => `/uploads/${f.filename}`);
  }
  if (req.file) {
    return [`/uploads/${req.file.filename}`];
  }
  if (body.media_urls && typeof body.media_urls === 'string') {
    try { return JSON.parse(body.media_urls); } catch { /* ignore */ }
  }
  return undefined;
}

/**
 * Creates a new post.
 *
 * Accepts multiple file uploads (multipart/form-data, field 'images', up to 5).
 * Falls back to single 'image' field for backwards compatibility.
 *
 * @route POST /api/posts
 */
export const createPost = asyncHandler(async (req, res) => {
  const postData = { ...req.body };
  postData.author_id = req.user.id;

  if (postData.content && Buffer.byteLength(postData.content, 'utf8') > MAX_CONTENT_BYTES) {
    throw new AppError(`Content too large. Max ${Math.floor(MAX_CONTENT_BYTES / 1024)}KB`, 413);
  }

  const mediaUrls = resolveMediaUrls(req, postData);
  if (mediaUrls) postData.media_urls = mediaUrls;

  const item = await prisma.post.create({ data: postData });

  const [fullItem] = await Promise.all([
    prisma.post.findUnique({ where: { id: item.id }, include: POST_INCLUDE }),
    SystemLogger.logCreate('Post', item.id, {
      title: item.title,
      content: item.content,
      author_id: item.author_id,
      media_urls: item.media_urls
    }, req, 'Post created')
  ]);

  getIO()?.emit('post_created', fullItem);
  res.status(201).json(fullItem);
});

/**
 * Lists posts.
 *
 * Query params:
 * - `q`: searches title/content
 * - `author_id`: filters by author
 * - `limit`, `offset`: pagination
 *
 * @route GET /api/posts
 */
export const getPosts = asyncHandler(async (req, res) => {
  const { q, author_id, limit = 50, offset = 0 } = req.query;
  const where = {};
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { content: { contains: q, mode: 'insensitive' } }
  ];
  if (author_id) where.author_id = author_id;

  const items = await prisma.post.findMany({
    where,
    take: Number(limit),
    skip: Number(offset),
    orderBy: [
      { is_pinned: 'desc' },
      { created_at: 'desc' }
    ],
    include: POST_INCLUDE
  });
  res.json(items);
});

/**
 * Retrieves a single post by id (includes author, likes, and comments).
 * Increments views_count once per user/session.
 * @route GET /api/posts/:id
 */
export const getPostById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const item = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } },
      postLikes: { select: { user_id: true } },
      comments: {
        include: {
          author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } },
          replies: {
            include: {
              author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } }
            }
          }
        }
      }
    }
  });
  if (!item) throw new NotFoundError('Post not found');

  // Increment views_count (simple dedup by user/ip + post)
  const viewerKey = `${req.user?.id || req.ip}_${item.id}`;
  if (!viewedPosts.has(viewerKey)) {
    viewedPosts.set(viewerKey, Date.now());
    await prisma.post.update({ where: { id: item.id }, data: { views_count: { increment: 1 } } });
    item.views_count = (item.views_count || 0) + 1;
  }

  res.json(item);
});

/**
 * Updates a post by id.
 *
 * Accepts optional file upload and enforces the content size limit.
 * Sets is_edited flag when content or title changes.
 *
 * @route PUT /api/posts/:id
 */
export const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const currentPost = await prisma.post.findUnique({ where: { id } });
  if (!currentPost) throw new NotFoundError('Post not found');

  const updates = { ...req.body };

  if (updates.content && Buffer.byteLength(updates.content, 'utf8') > MAX_CONTENT_BYTES) {
    throw new AppError(`Content too large. Max ${Math.floor(MAX_CONTENT_BYTES / 1024)}KB`, 413);
  }

  const mediaUrls = resolveMediaUrls(req, updates);
  if (mediaUrls) updates.media_urls = mediaUrls;

  // Set is_edited flag if content or title changes
  if (
    (updates.content && updates.content !== currentPost.content) ||
    (updates.title && updates.title !== currentPost.title)
  ) {
    updates.is_edited = true;
  }

  const updatedItem = await prisma.post.update({
    where: { id },
    data: updates,
    include: POST_INCLUDE
  });

  await SystemLogger.logUpdate('Post', updatedItem.id, {
    title: currentPost.title,
    content: currentPost.content,
    media_urls: currentPost.media_urls
  }, {
    title: updatedItem.title,
    content: updatedItem.content,
    media_urls: updatedItem.media_urls
  }, req, 'Post updated');

  getIO()?.emit('post_updated', updatedItem);
  res.json(updatedItem);
});

/**
 * Deletes a post by id.
 * @route DELETE /api/posts/:id
 */
export const deletePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post not found');

  await prisma.post.delete({ where: { id } });

  await SystemLogger.logDelete('Post', req.params.id, {
    title: post.title,
    content: post.content,
    author_id: post.author_id,
    media_urls: post.media_urls
  }, req, 'Post deleted');

  getIO()?.emit('post_deleted', { id: req.params.id });
  res.json({ message: 'Post deleted' });
});

/**
 * Toggles the current user's like on a post.
 * @route POST /api/posts/:id/like
 */
export const toggleLike = asyncHandler(async (req, res) => {
  const post_id = Number(req.params.id);
  const user_id = req.user.id;

  const existingLike = await prisma.postLike.findFirst({ where: { post_id, user_id } });

  if (existingLike) {
    await prisma.postLike.delete({ where: { id: existingLike.id } });
    getIO()?.emit('post_liked', { post_id, user_id, liked: false });
    res.json({ liked: false });
  } else {
    await prisma.postLike.create({ data: { post_id, user_id } });
    getIO()?.emit('post_liked', { post_id, user_id, liked: true });
    res.json({ liked: true });
  }
});

/**
 * Adds a comment to a post.
 * Supports nested replies via optional `parent_id`.
 * @route POST /api/posts/:id/comments
 */
export const addComment = asyncHandler(async (req, res) => {
  const post_id = Number(req.params.id);
  const { content, parent_id } = req.body;
  const author_id = req.user.id;

  if (!content || !content.trim()) {
    throw new AppError('Comment content is required', 400);
  }

  if (parent_id) {
    const parentComment = await prisma.comment.findUnique({ where: { id: Number(parent_id) } });
    if (!parentComment) throw new NotFoundError('Parent comment not found');
    if (parentComment.post_id !== post_id) {
      throw new AppError('Parent comment does not belong to this post', 400);
    }
    // Only allow 1 level of nesting
    if (parentComment.parent_id) {
      throw new AppError('Cannot reply to a reply. Only one level of nesting is allowed.', 400);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      post_id,
      author_id,
      content: content.trim(),
      parent_id: parent_id ? Number(parent_id) : null
    },
    include: {
      author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } }
    }
  });

  getIO()?.emit('comment_added', comment);
  res.status(201).json(comment);
});

/**
 * Lists comments for a post.
 * Returns comments as a tree: top-level comments with nested replies.
 * @route GET /api/posts/:id/comments
 */
export const getComments = asyncHandler(async (req, res) => {
  const post_id = Number(req.params.id);

  const comments = await prisma.comment.findMany({
    where: { post_id, parent_id: null },
    include: {
      author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } },
      replies: {
        include: {
          author: { select: { id: true, username: true, first_name: true, last_name: true, profile_photo_url: true } }
        },
        orderBy: { created_at: 'asc' }
      }
    },
    orderBy: { created_at: 'asc' }
  });
  res.json(comments);
});

/**
 * Deletes a comment.
 * Only the comment author or super_admin can delete.
 * @route DELETE /api/posts/:id/comments/:commentId
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const post_id = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment) throw new NotFoundError('Comment not found');

  if (comment.post_id !== post_id) {
    throw new AppError('Comment does not belong to this post', 400);
  }

  if (String(comment.author_id) !== String(req.user.id) && req.user.role !== 'super_admin') {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });

  getIO()?.emit('comment_deleted', { post_id: req.params.id, comment_id: req.params.commentId });
  res.json({ message: 'Comment deleted' });
});

/**
 * Toggles the pinned status of a post.
 * @route POST /api/posts/:id/pin
 */
export const togglePin = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new NotFoundError('Post not found');

  const updated = await prisma.post.update({
    where: { id },
    data: { is_pinned: !post.is_pinned }
  });

  getIO()?.emit('post_pinned', { id: updated.id, is_pinned: updated.is_pinned });
  res.json({ is_pinned: updated.is_pinned });
});
