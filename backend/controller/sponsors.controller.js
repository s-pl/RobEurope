import prisma from '../lib/prisma.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

/**
 * @fileoverview Sponsor API handlers.
 */

/**
 * Creates a sponsor.
 * @route POST /api/sponsors
 */
export const createSponsor = async (req, res) => {
  try {
    const sponsorData = { ...req.body };
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      sponsorData.logo_url = fileInfo.url;
    }
    const item = await prisma.sponsor.create({ data: sponsorData });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lists sponsors.
 * @route GET /api/sponsors
 */
export const getSponsors = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    const items = await prisma.sponsor.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { name: 'asc' } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a sponsor by id.
 * @route GET /api/sponsors/:id
 */
export const getSponsorById = async (req, res) => {
  try {
    const item = await prisma.sponsor.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Sponsor not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a sponsor.
 * @route PUT /api/sponsors/:id
 */
export const updateSponsor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = { ...req.body };
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.logo_url = fileInfo.url;
    }
    const existing = await prisma.sponsor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Sponsor not found' });
    const updatedItem = await prisma.sponsor.update({ where: { id }, data: updates });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a sponsor.
 * @route DELETE /api/sponsors/:id
 */
export const deleteSponsor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.sponsor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Sponsor not found' });
    await prisma.sponsor.delete({ where: { id } });
    res.json({ message: 'Sponsor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
