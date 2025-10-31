import db from '../models/index.js'; 
const Stream = db.Stream;


export const getAllStreams = async (req, res) => {
  try {
    const streams = await Stream.findAll();
    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getStreamById = async (req, res) => {
  try {
    const stream = await Stream.findByPk(req.params.id);
    if (!stream) return res.status(404).json({ error: 'Stream no encontrado' });
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createStream = async (req, res) => {
  try {
    const { titulo, descripcion, url, activo } = req.body;
    const newStream = await Stream.create({ titulo, descripcion, url, activo });
    res.status(201).json(newStream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
import db from '../models/index.js';
const { Stream } = db;

function isPositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0;
}

function isValidUrl(s) {
  try {
    if (!s) return false;
    new URL(s);
    return true;
  } catch (e) { return false; }
}

const ALLOWED_PLATFORMS = ['twitch', 'youtube', 'kick'];

const streamController = {
  // CREATE
  async create(req, res) {
    try {
      const body = req.body || {};
      const errors = [];

      if (!body.title || String(body.title).trim().length < 2) errors.push('title is required (min 2 chars)');

      if (!body.platform) body.platform = 'twitch';
      if (!ALLOWED_PLATFORMS.includes(body.platform)) errors.push('platform must be one of: ' + ALLOWED_PLATFORMS.join(', '));

      if (body.stream_url && !isValidUrl(body.stream_url)) errors.push('stream_url must be a valid URL');

      if (body.host_team_id != null && body.host_team_id !== '') {
        if (!isPositiveInt(body.host_team_id)) errors.push('host_team_id must be a positive integer');
        else body.host_team_id = Number(body.host_team_id);
      } else {
        body.host_team_id = null;
      }

      if (body.competition_id != null && body.competition_id !== '') {
        if (!isPositiveInt(body.competition_id)) errors.push('competition_id must be a positive integer');
        else body.competition_id = Number(body.competition_id);
      } else {
        body.competition_id = null;
      }

      body.is_live = !!body.is_live && (body.is_live === true || body.is_live === 'true' || body.is_live === 1 || body.is_live === '1');

      if (errors.length) return res.status(400).json({ errors });

      const now = new Date();
      const stream = await Stream.create({
        title: String(body.title).trim(),
        description: body.description || null,
        platform: body.platform,
        stream_url: body.stream_url || null,
        is_live: body.is_live,
        host_team_id: body.host_team_id,
        competition_id: body.competition_id,
        created_at: now
      });

      return res.status(201).json(stream);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // READ ALL
  async getAll(req, res) {
    try {
      const streams = await Stream.findAll({ order: [['created_at', 'DESC']] });
      return res.json(streams);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // READ ONE
  async getById(req, res) {
    try {
      const id = req.params.id;
      if (!isPositiveInt(id)) return res.status(400).json({ error: 'Invalid stream id' });
      const stream = await Stream.findByPk(Number(id));
      if (!stream) return res.status(404).json({ error: 'Stream not found' });
      return res.json(stream);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // UPDATE
  async update(req, res) {
    try {
      const id = req.params.id;
      if (!isPositiveInt(id)) return res.status(400).json({ error: 'Invalid stream id' });
      const stream = await Stream.findByPk(Number(id));
      if (!stream) return res.status(404).json({ error: 'Stream not found' });

      const body = req.body || {};
      const updates = {};
      const errors = [];
      if (body.title != null) {
        if (String(body.title).trim().length < 2) errors.push('title must be at least 2 chars');
        else updates.title = String(body.title).trim();
      }
      if (body.description != null) updates.description = body.description;
      if (body.platform != null) {
        if (!ALLOWED_PLATFORMS.includes(body.platform)) errors.push('platform invalid');
        else updates.platform = body.platform;
      }
      if (body.stream_url != null) {
        if (body.stream_url !== '' && !isValidUrl(body.stream_url)) errors.push('stream_url invalid');
        else updates.stream_url = body.stream_url || null;
      }
      if (body.host_team_id != null) {
        if (body.host_team_id === '') updates.host_team_id = null;
        else if (!isPositiveInt(body.host_team_id)) errors.push('host_team_id invalid');
        else updates.host_team_id = Number(body.host_team_id);
      }
      if (body.competition_id != null) {
        if (body.competition_id === '') updates.competition_id = null;
        else if (!isPositiveInt(body.competition_id)) errors.push('competition_id invalid');
        else updates.competition_id = Number(body.competition_id);
      }
      if (body.is_live != null) updates.is_live = !!body.is_live && (body.is_live === true || body.is_live === 'true' || body.is_live === 1 || body.is_live === '1');

      if (errors.length) return res.status(400).json({ errors });

      await stream.update(updates);
      return res.json(stream);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // DELETE
  async delete(req, res) {
    try {
      const id = req.params.id;
      if (!isPositiveInt(id)) return res.status(400).json({ error: 'Invalid stream id' });
      const stream = await Stream.findByPk(Number(id));
      if (!stream) return res.status(404).json({ error: 'Stream not found' });
      await stream.destroy();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};


export const updateStream = async (req, res) => {
  try {
    const { titulo, descripcion, url, activo } = req.body;
    const stream = await Stream.findByPk(req.params.id);
    if (!stream) return res.status(404).json({ error: 'Stream no encontrado' });

    await stream.update({ titulo, descripcion, url, activo });
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteStream = async (req, res) => {
  try {
    const stream = await Stream.findByPk(req.params.id);
    if (!stream) return res.status(404).json({ error: 'Stream no encontrado' });

    await stream.destroy();
    res.json({ message: 'Stream eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
