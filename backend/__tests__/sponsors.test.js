import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSponsor,
  getSponsors,
  getSponsorById,
  updateSponsor,
  deleteSponsor
} from '../controller/sponsors.controller.js';
import db from '../models/index.js';

// Mock dependencies
vi.mock('../models/index.js', () => {
  const Sponsor = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    default: { Sponsor },
  };
});

vi.mock('../middleware/upload.middleware.js', () => ({
  getFileInfo: vi.fn(() => null),
}));

vi.mock('../utils/systemLogger.js', () => ({
  default: {
    logCreate: vi.fn(),
    logUpdate: vi.fn(),
    logDelete: vi.fn(),
  },
}));

vi.mock('../utils/realtime.js', () => ({
  getIO: vi.fn(() => ({ emit: vi.fn() })),
}));

describe('Sponsors Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      session: { user: { id: 'user-1', role: 'super_admin' } },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('createSponsor', () => {
    it('should create a sponsor and return 201', async () => {
      const mockSponsor = { 
        id: 1, 
        name: 'Test Sponsor', 
        description: 'A test sponsor',
        website: 'https://testsponsor.com'
      };
      db.Sponsor.create.mockResolvedValue(mockSponsor);
      
      req.body = { 
        name: 'Test Sponsor', 
        description: 'A test sponsor',
        website: 'https://testsponsor.com'
      };

      await createSponsor(req, res);

      expect(db.Sponsor.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSponsor);
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Sponsor.create.mockRejectedValue(error);
      req.body = { name: 'Test', description: 'Test' };

      await createSponsor(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getSponsors', () => {
    it('should return a list of sponsors', async () => {
      const mockSponsors = [
        { id: 1, name: 'Sponsor 1' },
        { id: 2, name: 'Sponsor 2' },
      ];
      db.Sponsor.findAll.mockResolvedValue(mockSponsors);

      await getSponsors(req, res);

      expect(db.Sponsor.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockSponsors);
    });

    it('should filter sponsors by query (q)', async () => {
      db.Sponsor.findAll.mockResolvedValue([]);
      req.query = { q: 'gold' };

      await getSponsors(req, res);

      expect(db.Sponsor.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: expect.any(Object) })
        })
      );
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Sponsor.findAll.mockRejectedValue(error);

      await getSponsors(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getSponsorById', () => {
    it('should return a sponsor by id', async () => {
      const mockSponsor = { id: 1, name: 'Test Sponsor' };
      db.Sponsor.findByPk.mockResolvedValue(mockSponsor);
      req.params = { id: 1 };

      await getSponsorById(req, res);

      expect(db.Sponsor.findByPk).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockSponsor);
    });

    it('should return 404 if sponsor not found', async () => {
      db.Sponsor.findByPk.mockResolvedValue(null);
      req.params = { id: 999 };

      await getSponsorById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sponsor not found' });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Sponsor.findByPk.mockRejectedValue(error);
      req.params = { id: 1 };

      await getSponsorById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('updateSponsor', () => {
    it('should update a sponsor and return updated sponsor', async () => {
      db.Sponsor.update.mockResolvedValue([1]);
      db.Sponsor.findByPk.mockResolvedValue({ id: 1, name: 'Updated Sponsor' });
      req.params = { id: 1 };
      req.body = { name: 'Updated Sponsor' };

      await updateSponsor(req, res);

      expect(db.Sponsor.update).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({ where: { id: req.params.id } })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Updated Sponsor' }));
    });

    it('should return 404 if sponsor not found', async () => {
      db.Sponsor.update.mockResolvedValue([0]);
      req.params = { id: 999 };

      await updateSponsor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sponsor not found' });
    });
  });

  describe('deleteSponsor', () => {
    it('should delete a sponsor and return success', async () => {
      req.params = { id: 1 };

      db.Sponsor.destroy.mockResolvedValue(1);

      await deleteSponsor(req, res);

      expect(db.Sponsor.destroy).toHaveBeenCalledWith({ where: { id: req.params.id } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Sponsor deleted' });
    });

    it('should return 404 if sponsor not found', async () => {
      db.Sponsor.destroy.mockResolvedValue(0);
      req.params = { id: 999 };

      await deleteSponsor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sponsor not found' });
    });
  });
});