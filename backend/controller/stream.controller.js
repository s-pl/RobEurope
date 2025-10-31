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
