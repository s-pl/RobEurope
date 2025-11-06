import db from '../models/index.js';
const { Post, User } = db;
import { Op } from 'sequelize';

export const createPost = async (req, res) => {
  try {
    const item = await Post.create(req.body);
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
    const [updated] = await Post.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    const updatedItem = await Post.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const deleted = await Post.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
