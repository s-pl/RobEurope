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
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
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
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
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
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
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
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
