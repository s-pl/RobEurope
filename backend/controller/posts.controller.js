import db from '../models/index.js';
const { Post, User, PostLike, Comment } = db;
import { Op } from 'sequelize';
import { getFileInfo } from '../middleware/upload.middleware.js';
import SystemLogger from '../utils/systemLogger.js';
import { getIO } from '../utils/realtime.js';

const MAX_CONTENT_BYTES = Number(process.env.POST_CONTENT_MAX_BYTES || 200 * 1024); // 200 kb max payload

export const createPost = async (req, res) => {
  try {
    const postData = { ...req.body };

    // Enforce content max size to avoid oversized payloads (e.g., pasted base64)
    if (postData.content && Buffer.byteLength(postData.content, 'utf8') > MAX_CONTENT_BYTES) {
      return res.status(413).json({ error: `Content too large. Max ${Math.floor(MAX_CONTENT_BYTES/1024)}KB` });
    }

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      postData.media_urls = [fileInfo.url]; // Assuming single image for now
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
            include: [{
                model: User,
                attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
            }]
        }
      ]
    });
    if (!item) return res.status(404).json({ error: 'Post not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.media_urls = [fileInfo.url]; // Assuming single image for now
    }

    const [updated] = await Post.update(updates, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    const updatedItem = await Post.findByPk(req.params.id);

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

export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const author_id = req.user.id;

        const comment = await Comment.create({
            post_id: id,
            author_id,
            content
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

export const getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await Comment.findAll({
            where: { post_id: id },
            include: [{
                model: User,
                attributes: ['id', 'username', 'first_name', 'last_name', 'profile_photo_url']
            }],
            order: [['created_at', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

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
