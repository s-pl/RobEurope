import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadRobotFile,
  deleteRobotFile,
  toggleFileVisibility
} from '../controller/robot_file.controller.js';
import db from '../models/index.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

vi.mock('../models/index.js', () => {
  const RobotFile = {
    findByPk: vi.fn(),
    create: vi.fn()
  };
  const TeamMembers = {
    findOne: vi.fn()
  };
  return {
    default: {
      RobotFile,
      TeamMembers,
      Registration: {},
      User: {},
      Team: {}
    }
  };
});

vi.mock('../middleware/upload.middleware.js', () => ({
  getFileInfo: vi.fn()
}));

describe('Robot File Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'user-1', role: 'member' }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('uploadRobotFile', () => {
    it('rejects uploads without a file payload', async () => {
      getFileInfo.mockReturnValue(null);
      req.body = { team_id: 1, competition_id: 2 };

      await uploadRobotFile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });
  });

  describe('deleteRobotFile', () => {
    it('denies deletion when the user is not a member nor admin', async () => {
      const mockFile = { id: 10, team_id: 55 };
      db.RobotFile.findByPk.mockResolvedValue(mockFile);
      db.TeamMembers.findOne.mockResolvedValue(null);
      req.params.id = 10;

      await deleteRobotFile(req, res);

      expect(db.TeamMembers.findOne).toHaveBeenCalledWith({
        where: {
          team_id: mockFile.team_id,
          user_id: req.user.id,
          left_at: null
        }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Permission denied' });
    });
  });

  describe('toggleFileVisibility', () => {
    it('flips the visibility flag and persists the change', async () => {
      const save = vi.fn();
      const mockFile = { id: 20, team_id: 9, is_public: false, save };
      db.RobotFile.findByPk.mockResolvedValue(mockFile);
      db.TeamMembers.findOne.mockResolvedValue({ id: 'member-record' });
      req.params.id = 20;

      await toggleFileVisibility(req, res);

      expect(mockFile.is_public).toBe(true);
      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockFile);
    });
  });
});
