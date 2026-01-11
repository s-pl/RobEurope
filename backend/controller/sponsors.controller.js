import db from '../models/index.js';
const { Sponsor } = db;
import { Op } from 'sequelize';
import { getFileInfo } from '../middleware/upload.middleware.js';

/**
 * @fileoverview
 * Sponsor API handlers.
 *
 * Sponsors support optional logo upload (multipart/form-data).
 */

/**
 * Creates a sponsor.
 * @route POST /api/sponsors
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const createSponsor = async (req, res) => {
  try {
    const sponsorData = { ...req.body };

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      sponsorData.logo_url = fileInfo.url;
    }

    const item = await Sponsor.create(sponsorData);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lists sponsors.
 * @route GET /api/sponsors
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getSponsors = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    const items = await Sponsor.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a sponsor by id.
 * @route GET /api/sponsors/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getSponsorById = async (req, res) => {
  try {
    const item = await Sponsor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sponsor not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a sponsor.
 * @route PUT /api/sponsors/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const updateSponsor = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.logo_url = fileInfo.url;
    }

    const [updated] = await Sponsor.update(updates, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Sponsor not found' });
    const updatedItem = await Sponsor.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a sponsor.
 * @route DELETE /api/sponsors/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const deleteSponsor = async (req, res) => {
  try {
    const deleted = await Sponsor.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Sponsor not found' });
    res.json({ message: 'Sponsor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
