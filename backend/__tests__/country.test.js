import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCountries,
  getCountryById,
  createCountry
} from '../controller/country.controller.js';
import db from '../models/index.js';

vi.mock('../models/index.js', () => {
  const Country = {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  };
  return { default: { Country } };
});

describe('Country Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('getCountries', () => {
    it('returns the country list ordered by name', async () => {
      const mockCountries = [
        { id: 1, name: 'Germany' },
        { id: 2, name: 'Spain' }
      ];
      db.Country.findAll.mockResolvedValue(mockCountries);

      await getCountries(req, res);

      expect(db.Country.findAll).toHaveBeenCalledWith({ order: [['name', 'ASC']] });
      expect(res.json).toHaveBeenCalledWith(mockCountries);
    });
  });

  describe('getCountryById', () => {
    it('returns 404 when the country is missing', async () => {
      db.Country.findByPk.mockResolvedValue(null);
      req.params.id = 99;

      await getCountryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Country not found' });
    });
  });

  describe('createCountry', () => {
    it('persists the payload and responds with 201', async () => {
      const created = { id: 5, code: 'FR', name: 'France', flag_emoji: ':flag-fr:' };
      db.Country.create.mockResolvedValue(created);
      req.body = { code: 'FR', name: 'France', flag_emoji: ':flag-fr:' };

      await createCountry(req, res);

      expect(db.Country.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });
  });
});
