import db from '../models/index.js';
const { User } = db;

import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

export const createUser = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    const mapped_users = users.map(user => {
      const { password_hash, phone, role, email, ...userData } = user.toJSON(); // exclude sensitive fields
      return userData;
    });
    res.json(mapped_users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateUser = async (req, res) => {
  try {
    const [updated] = await User.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const updatedUser = await User.findByPk(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const where = q ? {
      [Op.or]: [
        { email: { [Op.like]: `%${q}%` } },
        { first_name: { [Op.like]: `%${q}%` } },
        { last_name: { [Op.like]: `%${q}%` } }
      ]
    } : {};

    const users = await User.findAll({ where, attributes: { exclude: ['password_hash'] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getSelf = async (req, res) => {
  try {
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ error: 'No autorizado' });
    const user = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateSelf = async (req, res) => {
  try {
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ error: 'No autorizado' });

    // Allowed fields to update by user themselves
    const allowed = ['first_name', 'last_name', 'phone', 'profile_photo_url', 'country_id', 'is_active'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No hay campos válidos para actualizar' });

    updates.updated_at = new Date();

    const [updated] = await User.update(updates, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteSelf = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// delete by id (admin-style) — validate numeric id
export const deleteUser = async (req, res) => {
  try {
    const idParam = req.params.id;
    // protect against receiving 'me' or invalid strings
    if (idParam === 'me') return res.status(400).json({ error: "Use /me endpoint to delete your own account" });

    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid user id' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
