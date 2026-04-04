/**
 * @fileoverview Country CRUD endpoints.
 *
 * Public read endpoints return the country list / details.
 * Write endpoints are intended to be protected by route middleware (super_admin).
 */

import prisma from '../lib/prisma.js';

/**
 * List all countries.
 *
 * @route GET /api/country
 */
export const getCountries = async (req, res) => {
  try {
    const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Get a country by id.
 *
 * @route GET /api/country/:id
 */
export const getCountryById = async (req, res) => {
  try {
    const country = await prisma.country.findUnique({ where: { id: Number(req.params.id) } });
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Create a new country (super_admin).
 *
 * @route POST /api/country
 */
export const createCountry = async (req, res) => {
  try {
    const { code, name, flag_emoji } = req.body;
    const country = await prisma.country.create({ data: { code, name, flag_emoji } });
    res.status(201).json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Update a country by id (super_admin).
 *
 * @route PUT /api/country/:id
 */
export const updateCountry = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updatedCountry = await prisma.country.update({
      where: { id },
      data: req.body
    }).catch(() => null);
    if (!updatedCountry) return res.status(404).json({ error: 'Country not found' });
    res.json(updatedCountry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Delete a country by id (super_admin).
 *
 * @route DELETE /api/country/:id
 */
export const deleteCountry = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.country.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Country not found' });
    await prisma.country.delete({ where: { id } });
    res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
