import db from '../models/index.js';
const { Post, User } = db;
import { Op } from 'sequelize';
import { getFileInfo } from '../middleware/upload.middleware.js';
import SystemLogger from '../utils/systemLogger.js';

export const createPost = async (req, res) => {
  try {
    const postData = { ...req.body };

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

    res.status(201).json(item);
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

    const items = await Post.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['created_at', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const item = await Post.findByPk(req.params.id);
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

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
