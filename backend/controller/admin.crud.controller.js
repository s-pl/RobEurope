import db from '../models/index.js';

const modelConfigs = {
  teams: {
    model: 'Team',
    label: 'Equipos',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text', list: true, form: false },
      { name: 'name', label: 'Nombre', type: 'text', list: true, form: true, required: true },
      { name: 'country_id', label: 'País ID', type: 'number', list: false, form: true }, // TODO: Select
      { name: 'city', label: 'Ciudad', type: 'text', list: true, form: true },
      { name: 'institution', label: 'Institución', type: 'text', list: true, form: true },
      { name: 'description', label: 'Descripción', type: 'textarea', list: false, form: true },
      { name: 'website_url', label: 'Sitio Web', type: 'text', list: false, form: true },
      { name: 'logo_url', label: 'Logo URL', type: 'text', list: false, form: true },
      { name: 'social_links', label: 'Redes Sociales (JSON)', type: 'textarea', list: false, form: true },
      { name: 'stream_url', label: 'Stream URL', type: 'text', list: false, form: true },
    ]
  },
  posts: {
    model: 'Post',
    label: 'Posts',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text', list: true, form: false },
      { name: 'title', label: 'Título', type: 'text', list: true, form: true, required: true },
      { name: 'content', label: 'Contenido', type: 'textarea', list: false, form: true, required: true },
      { name: 'author_id', label: 'Autor ID', type: 'number', list: true, form: true, required: true },
      { name: 'media_urls', label: 'Media URLs (JSON)', type: 'textarea', list: false, form: true },
      { name: 'stats', label: 'Stats (JSON)', type: 'textarea', list: false, form: true },
      { name: 'created_at', label: 'Creado', type: 'datetime', list: true, form: false },
    ]
  },
  sponsors: {
    model: 'Sponsor',
    label: 'Patrocinadores',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text', list: true, form: false },
      { name: 'name', label: 'Nombre', type: 'text', list: true, form: true, required: true },
      { name: 'logo_url', label: 'Logo URL', type: 'text', list: true, form: true },
      { name: 'website_url', label: 'Sitio Web', type: 'text', list: true, form: true },
      { name: 'type', label: 'Tipo', type: 'text', list: true, form: true },
    ]
  },
  countries: {
    model: 'Country',
    label: 'Países',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text', list: true, form: false },
      { name: 'name', label: 'Nombre', type: 'text', list: true, form: true, required: true },
      { name: 'code', label: 'Código', type: 'text', list: true, form: true, required: true },
      { name: 'flag_emoji', label: 'Bandera', type: 'text', list: true, form: true },
    ]
  },
  competitions: {
    model: 'Competition',
    label: 'Competiciones',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', type: 'text', list: true, form: false },
      { name: 'title', label: 'Título', type: 'text', list: true, form: true, required: true },
      { name: 'slug', label: 'Slug', type: 'text', list: true, form: true, required: true },
      { name: 'description', label: 'Descripción', type: 'textarea', list: false, form: true },
      { name: 'status', label: 'Estado', type: 'select', options: ['draft', 'published', 'archived'], list: true, form: true },
      { name: 'location', label: 'Ubicación', type: 'text', list: true, form: true },
      { name: 'max_teams', label: 'Max Equipos', type: 'number', list: false, form: true },
      { name: 'start_date', label: 'Fecha Inicio', type: 'datetime', list: true, form: true },
      { name: 'end_date', label: 'Fecha Fin', type: 'datetime', list: true, form: true },
      { name: 'registration_start', label: 'Inicio Registro', type: 'datetime', list: false, form: true },
      { name: 'registration_end', label: 'Fin Registro', type: 'datetime', list: false, form: true },
      { name: 'stream_url', label: 'Stream URL', type: 'text', list: false, form: true },
    ]
  }
};

export const list = async (req, res) => {
  const { model } = req.params;
  const config = modelConfigs[model];

  if (!config) {
    return res.status(404).send('Model not found');
  }

  try {
    const Model = db[config.model];
    const items = await Model.findAll();
    
    res.render('admin/generic-list', {
      title: config.label,
      config,
      items,
      modelName: model,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving data');
  }
};

export const form = async (req, res) => {
  const { model, id } = req.params;
  const config = modelConfigs[model];

  if (!config) {
    return res.status(404).send('Model not found');
  }

  try {
    let item = null;
    if (id) {
      const Model = db[config.model];
      item = await Model.findByPk(id);
      if (!item) return res.status(404).send('Item not found');
    }

    res.render('admin/generic-form', {
      title: id ? `Editar ${config.label}` : `Crear ${config.label}`,
      config,
      item,
      modelName: model,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading form');
  }
};

export const save = async (req, res) => {
  const { model, id } = req.params;
  const config = modelConfigs[model];

  if (!config) {
    return res.status(404).send('Model not found');
  }

  try {
    const Model = db[config.model];
    const data = req.body;

    // Handle JSON fields
    config.fields.forEach(field => {
      if ((field.type === 'textarea' && field.name.includes('JSON')) || field.name === 'social_links' || field.name === 'media_urls' || field.name === 'stats' || field.name === 'dates') {
        if (data[field.name]) {
          try {
            data[field.name] = JSON.parse(data[field.name]);
          } catch (e) {
            // Keep as string if parse fails, or handle error
            console.error(`Failed to parse JSON for ${field.name}`, e);
          }
        }
      }
    });

    if (id) {
      await Model.update(data, { where: { [config.pk]: id } });
    } else {
      await Model.create(data);
    }

    res.redirect(`/admin/${model}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving data: ' + error.message);
  }
};

export const remove = async (req, res) => {
  const { model, id } = req.params;
  const config = modelConfigs[model];

  if (!config) {
    return res.status(404).send('Model not found');
  }

  try {
    const Model = db[config.model];
    await Model.destroy({ where: { [config.pk]: id } });
    res.redirect(`/admin/${model}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting item');
  }
};
