/**
 * Registry of all available team page modules.
 * Each entry defines the module's display name, icon, default config, and sizing hints.
 */

export const MODULE_REGISTRY = {
  hero: {
    label: 'Portada del equipo',
    icon: '🏆',
    description: 'Banner principal con nombre, logo y redes sociales',
    defaultW: 12,
    defaultH: 1,
    minW: 8,
    defaultConfig: { showLogo: true, showSocials: true, tagline: '' }
  },
  stats: {
    label: 'Estadísticas',
    icon: '📊',
    description: 'Tarjetas con métricas del equipo (miembros, competiciones, etc.)',
    defaultW: 4,
    defaultH: 1,
    minW: 3,
    defaultConfig: {}
  },
  members: {
    label: 'Miembros',
    icon: '👥',
    description: 'Cuadrícula de los integrantes del equipo',
    defaultW: 5,
    defaultH: 1,
    minW: 3,
    defaultConfig: { showRole: true, showPhoto: true }
  },
  posts: {
    label: 'Publicaciones',
    icon: '📝',
    description: 'Últimas publicaciones relacionadas con el equipo',
    defaultW: 7,
    defaultH: 1,
    minW: 4,
    defaultConfig: { limit: 3 }
  },
  competitions: {
    label: 'Competiciones',
    icon: '🥇',
    description: 'Historial de competiciones y registros del equipo',
    defaultW: 8,
    defaultH: 1,
    minW: 4,
    defaultConfig: { limit: 5, showStatus: true }
  },
  about: {
    label: 'Sobre nosotros',
    icon: '💬',
    description: 'Sección de descripción libre del equipo',
    defaultW: 12,
    defaultH: 1,
    minW: 4,
    defaultConfig: { content: '' }
  },
  gallery: {
    label: 'Galería',
    icon: '🖼️',
    description: 'Galería de imágenes del equipo',
    defaultW: 12,
    defaultH: 1,
    minW: 6,
    defaultConfig: { limit: 8 }
  },
  robots: {
    label: 'Robots',
    icon: '🤖',
    description: 'Archivos y fichas técnicas de los robots del equipo',
    defaultW: 6,
    defaultH: 1,
    minW: 4,
    defaultConfig: { limit: 4 }
  },
  countdown: {
    label: 'Cuenta atrás',
    icon: '⏳',
    description: 'Cuenta regresiva hasta la próxima competición',
    defaultW: 4,
    defaultH: 1,
    minW: 3,
    defaultConfig: { label: 'Próxima competición' }
  },
  social: {
    label: 'Redes sociales',
    icon: '🔗',
    description: 'Botones de redes sociales y enlace a la web del equipo',
    defaultW: 4,
    defaultH: 1,
    minW: 3,
    defaultConfig: {}
  }
};

export const MODULE_TYPES = Object.keys(MODULE_REGISTRY);
