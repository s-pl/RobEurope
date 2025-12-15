import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeams, getTeamById, updateTeam, deleteTeam } from '../controller/teams.controller.js';

vi.mock('../models/index.js', () => {
  const Team = { findAll: vi.fn(), findByPk: vi.fn(), update: vi.fn(), destroy: vi.fn(), create: vi.fn() };
  const TeamMembers = { findOne: vi.fn(), create: vi.fn() };
  return { default: { Team, TeamMembers, User: {}, Country: {}, TeamInvite: {}, TeamJoinRequest: {}, Registration: {}, Competition: {}, Notification: { create: vi.fn() } } };
});

vi.mock('../middleware/upload.middleware.js', () => ({ getFileInfo: vi.fn(() => null) }));
vi.mock('../utils/realtime.js', () => ({ emitToUser: vi.fn() }));

import db from '../models/index.js';

describe('Teams Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  describe('getTeams', () => {
    it('should return a list of teams', async () => {
      const mockTeams = [{ id: 1, name: 'Team1' }];
      db.Team.findAll.mockResolvedValue(mockTeams);
      await getTeams(req, res);
      expect(db.Team.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockTeams);
    });

    it('should filter teams by search query', async () => {
      db.Team.findAll.mockResolvedValue([]);
      req.query = { q: 'test' };
      await getTeams(req, res);
      expect(db.Team.findAll).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      db.Team.findAll.mockRejectedValue(new Error('DB error'));
      await getTeams(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTeamById', () => {
    it('should return a team by id', async () => {
      const mockTeam = { id: 1, name: 'Team1' };
      db.Team.findByPk.mockResolvedValue(mockTeam);
      req.params = { id: '1' };
      await getTeamById(req, res);
      expect(db.Team.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockTeam);
    });

    it('should return 404 if not found', async () => {
      db.Team.findByPk.mockResolvedValue(null);
      req.params = { id: 'x' };
      await getTeamById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      db.Team.findByPk.mockRejectedValue(new Error('DB error'));
      req.params = { id: '1' };
      await getTeamById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTeam', () => {
    it('should update a team', async () => {
      db.Team.update.mockResolvedValue([1]);
      db.Team.findByPk.mockResolvedValue({ id: 1, name: 'Updated' });
      req.params = { id: '1' };
      req.body = { name: 'Updated' };
      await updateTeam(req, res);
      expect(db.Team.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
    });

    it('should return 404 if not found', async () => {
      db.Team.update.mockResolvedValue([0]);
      db.Team.findByPk.mockResolvedValue(null);
      req.params = { id: 'x' };
      req.body = { name: 't' };
      await updateTeam(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors and return 500', async () => {
      db.Team.update.mockRejectedValue(new Error('DB error'));
      req.params = { id: '1' };
      req.body = { name: 'Updated' };

      await updateTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'DB error' }));
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team', async () => {
      db.Team.destroy.mockResolvedValue(1);
      req.params = { id: '1' };
      await deleteTeam(req, res);
      expect(db.Team.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Team deleted' });
    });

    it('should return 404 if not found', async () => {
      db.Team.destroy.mockResolvedValue(0);
      req.params = { id: 'x' };
      await deleteTeam(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors and return 500', async () => {
      db.Team.destroy.mockRejectedValue(new Error('DB error'));
      req.params = { id: '1' };

      await deleteTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'DB error' }));
    });
  });
});
