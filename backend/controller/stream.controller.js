// controllers/streamController.js
import { Stream } from '../models/index.js';

const streamController = {
  // CREATE
  async create(req, res) {
    try {
      const stream = await Stream.create(req.body);
      res.status(201).json(stream);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // READ ALL
  async getAll(req, res) {
    try {
      const streams = await Stream.findAll();
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // READ ONE
  async getById(req, res) {
    try {
      const stream = await Stream.findByPk(req.params.id);
      if (!stream) return res.status(404).json({ error: 'Stream not found' });
      res.json(stream);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // UPDATE
  async update(req, res) {
    try {
      const stream = await Stream.findByPk(req.params.id);
      if (!stream) return res.status(404).json({ error: 'Stream not found' });
      await stream.update(req.body);
      res.json(stream);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE
  async delete(req, res) {
    try {
      const stream = await Stream.findByPk(req.params.id);
      if (!stream) return res.status(404).json({ error: 'Stream not found' });
      await stream.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default streamController;
