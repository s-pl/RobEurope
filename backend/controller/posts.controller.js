import db from '../models/index.js';
const { Post, User, PostLike, Comment } = db;
import { Op } from 'sequelize';
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
const POST_INCLUDES = [
  { model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] },
  { model: PostLike, attributes: ['user_id'] },
  { model: Comment, attributes: ['id'] }
];

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

  const item = await Post.create(postData);

  const [fullItem] = await Promise.all([
    Post.findByPk(item.id, { include: POST_INCLUDES }),
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
  if (q) where[Op.or] = [
    { title: { [Op.like]: `%${q}%` } },
    { content: { [Op.like]: `%${q}%` } }
  ];
  if (author_id) where.author_id = author_id;

  const items = await Post.findAll({
    where,
    limit: Number(limit),
    offset: Number(offset),
    order: [
      ['is_pinned', 'DESC'],
      ['created_at', 'DESC']
    ],
    include: POST_INCLUDES
  });
  res.json(items);
});

/**
 * Retrieves a single post by id (includes author, likes, and comments).
 * Increments views_count once per user/session.
 * @route GET /api/posts/:id
 */
export const getPostById = asyncHandler(async (req, res) => {
  const item = await Post.findByPk(req.params.id, {
    include: [
      { model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] },
      { model: PostLike, attributes: ['user_id'] },
      {
        model: Comment,
        include: [
          { model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] },
          {
            model: Comment,
            as: 'replies',
            include: [{ model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] }]
          }
        ]
      }
    ]
  });
  if (!item) throw new NotFoundError('Post not found');

  // Increment views_count (simple dedup by user/ip + post)
  const viewerKey = `${req.user?.id || req.ip}_${item.id}`;
  if (!viewedPosts.has(viewerKey)) {
    viewedPosts.set(viewerKey, Date.now());
    await Post.increment('views_count', { where: { id: item.id } });
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
  const currentPost = await Post.findByPk(req.params.id);
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

  updates.updated_at = new Date();

  const [updated] = await Post.update(updates, { where: { id: req.params.id } });
  if (!updated) throw new NotFoundError('Post not found');

  const updatedItem = await Post.findByPk(req.params.id, { include: POST_INCLUDES });

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
  const post = await Post.findByPk(req.params.id);
  if (!post) throw new NotFoundError('Post not found');

  await post.destroy();

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
  const { id } = req.params;
  const user_id = req.user.id;

  const existingLike = await PostLike.findOne({ where: { post_id: id, user_id } });

  if (existingLike) {
    await existingLike.destroy();
    getIO()?.emit('post_liked', { post_id: id, user_id, liked: false });
    res.json({ liked: false });
  } else {
    await PostLike.create({ post_id: id, user_id });
    getIO()?.emit('post_liked', { post_id: id, user_id, liked: true });
    res.json({ liked: true });
  }
});

/**
 * Adds a comment to a post.
 * Supports nested replies via optional `parent_id`.
 * @route POST /api/posts/:id/comments
 */
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, parent_id } = req.body;
  const author_id = req.user.id;

  if (!content || !content.trim()) {
    throw new AppError('Comment content is required', 400);
  }

  if (parent_id) {
    const parentComment = await Comment.findByPk(parent_id);
    if (!parentComment) throw new NotFoundError('Parent comment not found');
    if (String(parentComment.post_id) !== String(id)) {
      throw new AppError('Parent comment does not belong to this post', 400);
    }
    // Only allow 1 level of nesting
    if (parentComment.parent_id) {
      throw new AppError('Cannot reply to a reply. Only one level of nesting is allowed.', 400);
    }
  }

  const comment = await Comment.create({
    post_id: id,
    author_id,
    content: content.trim(),
    parent_id: parent_id || null
  });

  await comment.reload({
    include: [{ model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] }]
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
  const { id } = req.params;

  const comments = await Comment.findAll({
    where: { post_id: id, parent_id: null },
    include: [
      { model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] },
      {
        model: Comment,
        as: 'replies',
        include: [{ model: User, attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'] }],
        order: [['created_at', 'ASC']]
      }
    ],
    order: [['created_at', 'ASC']]
  });
  res.json(comments);
});

/**
 * Deletes a comment.
 * Only the comment author or super_admin can delete.
 * @route DELETE /api/posts/:id/comments/:commentId
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  const comment = await Comment.findByPk(commentId);

  if (!comment) throw new NotFoundError('Comment not found');

  if (String(comment.post_id) !== String(id)) {
    throw new AppError('Comment does not belong to this post', 400);
  }

  if (String(comment.author_id) !== String(req.user.id) && req.user.role !== 'super_admin') {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  // Cascade will handle replies due to model config
  await comment.destroy();

  getIO()?.emit('comment_deleted', { post_id: id, comment_id: commentId });
  res.json({ message: 'Comment deleted' });
});

/**
 * Toggles the pinned status of a post.
 * @route POST /api/posts/:id/pin
 */
export const togglePin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByPk(id);
  if (!post) throw new NotFoundError('Post not found');

  post.is_pinned = !post.is_pinned;
  await post.save();

  getIO()?.emit('post_pinned', { id: post.id, is_pinned: post.is_pinned });
  res.json({ is_pinned: post.is_pinned });
});
