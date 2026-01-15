/**
 * @fileoverview Generic admin CRUD controllers (server-rendered).
 *
 * Used by the admin panel to render list and form pages for a small set of
 * whitelisted models. Model configuration (fields, labels) is defined in this file.
 */

import db from '../models/index.js';

const modelConfigs = {
  teams: {
    model: 'Team',
    label: 'Equipos',
    labelKey: 'crud.teams.label',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', labelKey: 'crud.fields.id', type: 'text', list: true, form: false },
      { name: 'name', label: 'Nombre', labelKey: 'crud.teams.fields.name', type: 'text', list: true, form: true, required: true },
      { name: 'country_id', label: 'País ID', labelKey: 'crud.teams.fields.countryId', type: 'number', list: false, form: true },
      { name: 'city', label: 'Ciudad', labelKey: 'crud.teams.fields.city', type: 'text', list: true, form: true },
      { name: 'institution', label: 'Institución', labelKey: 'crud.teams.fields.institution', type: 'text', list: true, form: true },
      { name: 'description', label: 'Descripción', labelKey: 'crud.teams.fields.description', type: 'textarea', list: false, form: true },
      { name: 'website_url', label: 'Sitio Web', labelKey: 'crud.fields.website', type: 'text', list: false, form: true },
      { name: 'logo_url', label: 'Logo URL', labelKey: 'crud.fields.logo', type: 'text', list: false, form: true },
      { name: 'social_links', label: 'Redes Sociales (JSON)', labelKey: 'crud.fields.socialLinks', type: 'textarea', list: false, form: true },
      { name: 'stream_url', label: 'Stream URL', labelKey: 'crud.fields.streamUrl', type: 'text', list: false, form: true },
    ]
  },
  posts: {
    model: 'Post',
    label: 'Posts',
    labelKey: 'crud.posts.label',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', labelKey: 'crud.fields.id', type: 'text', list: true, form: false },
      { name: 'title', label: 'Título', labelKey: 'crud.fields.title', type: 'text', list: true, form: true, required: true },
      { name: 'content', label: 'Contenido', labelKey: 'crud.posts.fields.content', type: 'textarea', list: false, form: true, required: true },
      { name: 'author_id', label: 'Autor ID', labelKey: 'crud.posts.fields.authorId', type: 'number', list: true, form: true, required: true },
      { name: 'media_urls', label: 'Media URLs (JSON)', labelKey: 'crud.fields.mediaUrls', type: 'textarea', list: false, form: true },
      { name: 'stats', label: 'Stats (JSON)', labelKey: 'crud.fields.stats', type: 'textarea', list: false, form: true },
      { name: 'created_at', label: 'Creado', labelKey: 'crud.fields.createdAt', type: 'datetime', list: true, form: false },
    ]
  },
  sponsors: {
    model: 'Sponsor',
    label: 'Patrocinadores',
    labelKey: 'crud.sponsors.label',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', labelKey: 'crud.fields.id', type: 'text', list: true, form: false },
      { name: 'name', label: 'Nombre', labelKey: 'crud.sponsors.fields.name', type: 'text', list: true, form: true, required: true },
      { name: 'logo_url', label: 'Logo URL', labelKey: 'crud.fields.logo', type: 'text', list: true, form: true },
      { name: 'website_url', label: 'Sitio Web', labelKey: 'crud.fields.website', type: 'text', list: true, form: true },
      { name: 'type', label: 'Tipo', labelKey: 'crud.sponsors.fields.type', type: 'text', list: true, form: true },
    ]
  },
  countries: {
    model: 'Country',
    label: 'Países',
    labelKey: 'crud.countries.label',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', labelKey: 'crud.fields.id', type: 'text', list: true, form: false },
      { name: 'name', label: 'Nombre', labelKey: 'crud.fields.name', type: 'text', list: true, form: true, required: true },
      { name: 'code', label: 'Código', labelKey: 'crud.countries.fields.code', type: 'text', list: true, form: true, required: true },
      { name: 'flag_emoji', label: 'Bandera', labelKey: 'crud.countries.fields.flag', type: 'text', list: true, form: true },
    ]
  },
  competitions: {
    model: 'Competition',
    label: 'Competiciones',
    labelKey: 'crud.competitions.label',
    pk: 'id',
    fields: [
      { name: 'id', label: 'ID', labelKey: 'crud.fields.id', type: 'text', list: true, form: false },
      { name: 'title', label: 'Título', labelKey: 'crud.fields.title', type: 'text', list: true, form: true, required: true },
      { name: 'slug', label: 'Slug', labelKey: 'crud.competitions.fields.slug', type: 'text', list: true, form: true, required: true },
      { name: 'description', label: 'Descripción', labelKey: 'crud.fields.description', type: 'textarea', list: false, form: true },
      { name: 'status', label: 'Estado', labelKey: 'crud.fields.status', type: 'select', options: ['draft', 'published', 'archived'], list: true, form: true },
      { name: 'location', label: 'Ubicación', labelKey: 'crud.competitions.fields.location', type: 'text', list: true, form: true },
      { name: 'max_teams', label: 'Max Equipos', labelKey: 'crud.competitions.fields.maxTeams', type: 'number', list: false, form: true },
      { name: 'start_date', label: 'Fecha Inicio', labelKey: 'crud.fields.startDate', type: 'datetime', list: true, form: true },
      { name: 'end_date', label: 'Fecha Fin', labelKey: 'crud.fields.endDate', type: 'datetime', list: true, form: true },
      { name: 'registration_start', label: 'Inicio Registro', labelKey: 'crud.competitions.fields.registrationStart', type: 'datetime', list: false, form: true },
      { name: 'registration_end', label: 'Fin Registro', labelKey: 'crud.competitions.fields.registrationEnd', type: 'datetime', list: false, form: true },
      { name: 'stream_url', label: 'Stream URL', labelKey: 'crud.fields.streamUrl', type: 'text', list: false, form: true },
    ]
  }
};

const localizeConfig = (config, req) => {
  // Translate the collection label - use fallback to default
  let collectionLabel = config.label;
  try {
    if (config.labelKey) {
      const translated = req.__(config.labelKey);
      // Only use translation if it's different from the key (meaning it was found)
      if (translated && !translated.includes('.')) {
        collectionLabel = translated;
      }
    }
  } catch (e) {
    console.error('Error translating collection label:', e);
  }
  
  // Translate field labels with fallback
  const translatedFields = config.fields.map(field => {
    let fieldLabel = field.label; // default fallback
    try {
      if (field.labelKey) {
        const translated = req.__(field.labelKey);
        // Only use translation if it was found (doesn't look like a key path)
        if (translated && !translated.includes('.')) {
          fieldLabel = translated;
        }
      }
    } catch (e) {
      console.error('Error translating field label:', field.labelKey, e);
    }
    return { ...field, label: fieldLabel };
  });
  
  return { ...config, label: collectionLabel, fields: translatedFields };
};

/**
 * Render a list view for a configured model.
 *
 * @route GET /admin/:model
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @returns {Promise<void>}
 */
export const list = async (req, res) => {
  const { model } = req.params;
  const config = modelConfigs[model];

  if (!config) {
    return res.status(404).send('Model not found');
  }

  try {
    const Model = db[config.model];
    const items = await Model.findAll();
    
    const localizedConfig = localizeConfig(config, req);
    res.render('admin/generic-list', {
      title: localizedConfig.label,
      config: localizedConfig,
      items,
      modelName: model,
      pageKey: model,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving data');
  }
};

/**
 * Render the create/edit form for a configured model.
 *
 * @route GET /admin/:model/create
 * @route GET /admin/:model/edit/:id
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @returns {Promise<void>}
 */
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

    const localizedConfig = localizeConfig(config, req);
    // Build title using i18n with mustache syntax: {{name}}
    const formTitleKey = id ? 'generic.form.editTitle' : 'generic.form.createTitle';
    const title = req.__(formTitleKey, { name: localizedConfig.label });
    res.render('admin/generic-form', {
      title,
      config: localizedConfig,
      item,
      modelName: model,
      pageKey: model,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading form');
  }
};

/**
 * Create or update a record for a configured model.
 *
 * @route POST /admin/:model/save
 * @route POST /admin/:model/save/:id
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @returns {Promise<void>}
 */
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

/**
 * Delete a record for a configured model.
 *
 * @route POST /admin/:model/delete/:id
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @returns {Promise<void>}
 */
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
