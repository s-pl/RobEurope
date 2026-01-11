/**
 * @fileoverview Country CRUD endpoints.
 *
 * Public read endpoints return the country list / details.
 * Write endpoints are intended to be protected by route middleware (super_admin).
 */

import db from '../models/index.js';
const { Country } = db;

/**
 * Express request.
 * @typedef {object} Request
 * @property {object} params
 * @property {object} query
 * @property {object} body
 */

/**
 * Express response.
 * @typedef {object} Response
 * @property {(status:number)=>Response} status
 * @property {(body:any)=>void} json
 */

/**
 * List all countries.
 *
 * @route GET /api/country
 * @param {Request} req
 * @param {Response} res
 */
export const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({ order: [['name', 'ASC']] });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Get a country by id.
 *
 * @route GET /api/country/:id
 * @param {Request} req
 * @param {Response} res
 */
export const getCountryById = async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
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
 * @param {Request} req
 * @param {Response} res
 */
export const createCountry = async (req, res) => {
  try {
    const { code, name, flag_emoji } = req.body;
    const country = await Country.create({ code, name, flag_emoji });
    res.status(201).json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Update a country by id (super_admin).
 *
 * @route PUT /api/country/:id
 * @param {Request} req
 * @param {Response} res
 */
export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Country.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'Country not found' });
    const updatedCountry = await Country.findByPk(id);
    res.json(updatedCountry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Delete a country by id (super_admin).
 *
 * @route DELETE /api/country/:id
 * @param {Request} req
 * @param {Response} res
 */
export const deleteCountry = async (req, res) => {
  try {
    const deleted = await Country.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Country not found' });
    res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
