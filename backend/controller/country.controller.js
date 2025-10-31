import db from '../models/index.js';
const { Country } = db;

export const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({ order: [['name', 'ASC']] });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getCountryById = async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id);
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createCountry = async (req, res) => {
  try {
    const { code, name, flag_emoji } = req.body;
    const country = await Country.create({ code, name, flag_emoji });
    res.status(201).json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


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


export const deleteCountry = async (req, res) => {
  try {
    const deleted = await Country.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Country not found' });
    res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
