import db from '../models/index.js';
const { Post, User, PostLike, Comment } = db;
import { Op } from 'sequelize';
import { getFileInfo } from '../middleware/upload.middleware.js';
import SystemLogger from '../utils/systemLogger.js';
import { getIO } from '../utils/realtime.js';

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

/**
 * Creates a new post.
 *
 * Accepts multiple file uploads (multipart/form-data, field 'images', up to 5).
 * Falls back to single 'image' field for backwards compatibility.
 *
 * @route POST /api/posts
 */
export const createPost = async (req, res) => {
  try {
    const postData = { ...req.body };

    // Always set author to the authenticated user
    postData.author_id = req.user.id;

    // Enforce content max size to avoid oversized payloads (e.g., pasted base64)
    if (postData.content && Buffer.byteLength(postData.content, 'utf8') > MAX_CONTENT_BYTES) {
      return res.status(413).json({ error: `Content too large. Max ${Math.floor(MAX_CONTENT_BYTES/1024)}KB` });
    }

    // Handle file uploads - support both single and multiple
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Multiple files from upload.array('images', 5)
      postData.media_urls = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.file) {
      // Single file fallback
      postData.media_urls = [`/uploads/${req.file.filename}`];
    } else if (postData.media_urls && typeof postData.media_urls === 'string') {
      try {
        postData.media_urls = JSON.parse(postData.media_urls);
      } catch {
        // ignore
      }
    }

    const item = await Post.create(postData);

    // Log post creation
    await SystemLogger.logCreate('Post', item.id, {
      title: item.title,
      content: item.content,
      author_id: item.author_id,
      media_urls: item.media_urls
    }, req, 'Post created');

    // Re-fetch with includes for richer payload to clients
    const fullItem = await Post.findByPk(item.id, {
      include: [
        { model: User, attributes: ['id','username','first_name','last_name','profile_photo_url'] },
        { model: PostLike, attributes: ['user_id'] },
        { model: Comment, attributes: ['id'] }
      ]
    });
    getIO()?.emit('post_created', fullItem);
    res.status(201).json(fullItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
export const getPosts = async (req, res) => {
  try {
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
      include: [
        {
            model: User,
            attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
        },
        {
            model: PostLike,
            attributes: ['user_id']
        },
        {
            model: Comment,
            attributes: ['id']
        }
      ]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a single post by id (includes author, likes, and comments).
 * Increments views_count once per user/session.
 * @route GET /api/posts/:id
 */
export const getPostById = async (req, res) => {
  try {
    const item = await Post.findByPk(req.params.id, {
      include: [
        {
            model: User,
            attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
        },
        {
            model: PostLike,
            attributes: ['user_id']
        },
        {
            model: Comment,
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
              },
              {
                model: Comment,
                as: 'replies',
                include: [{
                  model: User,
                  attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
                }]
              }
            ]
        }
      ]
    });
    if (!item) return res.status(404).json({ error: 'Post not found' });

    // Increment views_count (simple dedup by user/ip + post)
    const viewerKey = `${req.user?.id || req.ip}_${item.id}`;
    if (!viewedPosts.has(viewerKey)) {
      viewedPosts.set(viewerKey, Date.now());
      await Post.increment('views_count', { where: { id: item.id } });
      item.views_count = (item.views_count || 0) + 1;
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a post by id.
 *
 * Accepts optional file upload and enforces the content size limit.
 * Sets is_edited flag when content or title changes.
 *
 * @route PUT /api/posts/:id
 */
export const updatePost = async (req, res) => {
  try {
    // Get current post for logging old values
    const currentPost = await Post.findByPk(req.params.id);
    if (!currentPost) return res.status(404).json({ error: 'Post not found' });

    const updates = { ...req.body };

    // Enforce content max size
    if (updates.content && Buffer.byteLength(updates.content, 'utf8') > MAX_CONTENT_BYTES) {
      return res.status(413).json({ error: `Content too large. Max ${Math.floor(MAX_CONTENT_BYTES/1024)}KB` });
    }

    // Handle file uploads - support both single and multiple
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      updates.media_urls = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.file) {
      updates.media_urls = [`/uploads/${req.file.filename}`];
    } else if (updates.media_urls && typeof updates.media_urls === 'string') {
      try {
        updates.media_urls = JSON.parse(updates.media_urls);
      } catch {
        // ignore
      }
    }

    // Set is_edited flag if content or title changes
    if (
      (updates.content && updates.content !== currentPost.content) ||
      (updates.title && updates.title !== currentPost.title)
    ) {
      updates.is_edited = true;
    }

    updates.updated_at = new Date();

    const [updated] = await Post.update(updates, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    const updatedItem = await Post.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id','username','first_name','last_name','profile_photo_url'] },
        { model: PostLike, attributes: ['user_id'] },
        { model: Comment, attributes: ['id'] }
      ]
    });

    // Log post update
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a post by id.
 * @route DELETE /api/posts/:id
 */
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const deleted = await Post.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Post not found' });

    // Log post deletion
    await SystemLogger.logDelete('Post', req.params.id, {
      title: post.title,
      content: post.content,
      author_id: post.author_id,
      media_urls: post.media_urls
    }, req, 'Post deleted');

    getIO()?.emit('post_deleted', { id: req.params.id });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Toggles the current user's like on a post.
 * @route POST /api/posts/:id/like
 */
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const existingLike = await PostLike.findOne({
            where: { post_id: id, user_id }
        });

    if (existingLike) {
      await existingLike.destroy();
      getIO()?.emit('post_liked', { post_id: id, user_id, liked: false });
      res.json({ liked: false });
    } else {
      await PostLike.create({ post_id: id, user_id });
      getIO()?.emit('post_liked', { post_id: id, user_id, liked: true });
      res.json({ liked: true });
    }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Adds a comment to a post.
 * Supports nested replies via optional `parent_id`.
 * @route POST /api/posts/:id/comments
 */
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parent_id } = req.body;
        const author_id = req.user.id;

        if (!content || !content.trim()) {
          return res.status(400).json({ error: 'Comment content is required' });
        }

        // Validate parent_id if provided
        if (parent_id) {
          const parentComment = await Comment.findByPk(parent_id);
          if (!parentComment) {
            return res.status(404).json({ error: 'Parent comment not found' });
          }
          if (String(parentComment.post_id) !== String(id)) {
            return res.status(400).json({ error: 'Parent comment does not belong to this post' });
          }
          // Only allow 1 level of nesting
          if (parentComment.parent_id) {
            return res.status(400).json({ error: 'Cannot reply to a reply. Only one level of nesting is allowed.' });
          }
        }

        const comment = await Comment.create({
            post_id: id,
            author_id,
            content: content.trim(),
            parent_id: parent_id || null
        });

        const commentWithUser = await Comment.findByPk(comment.id, {
             include: [{
                model: User,
                attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
            }]
        });

    getIO()?.emit('comment_added', commentWithUser);
    res.status(201).json(commentWithUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Lists comments for a post.
 * Returns comments as a tree: top-level comments with nested replies.
 * @route GET /api/posts/:id/comments
 */
export const getComments = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch all top-level comments (no parent_id) with their replies
        const comments = await Comment.findAll({
            where: {
              post_id: id,
              parent_id: null
            },
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
              },
              {
                model: Comment,
                as: 'replies',
                include: [{
                  model: User,
                  attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
                }],
                order: [['created_at', 'ASC']]
              }
            ],
            order: [['created_at', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Deletes a comment.
 * Only the comment author or super_admin can delete.
 * @route DELETE /api/posts/:id/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (String(comment.post_id) !== String(id)) {
      return res.status(400).json({ error: 'Comment does not belong to this post' });
    }

    // Only author or super_admin can delete
    if (String(comment.author_id) !== String(req.user.id) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Delete the comment (cascade will handle replies due to model config)
    await comment.destroy();

    getIO()?.emit('comment_deleted', { post_id: id, comment_id: commentId });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Toggles the pinned status of a post.
 * @route POST /api/posts/:id/pin
 */
export const togglePin = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        post.is_pinned = !post.is_pinned;
        await post.save();

    getIO()?.emit('post_pinned', { id: post.id, is_pinned: post.is_pinned });
    res.json({ is_pinned: post.is_pinned });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
