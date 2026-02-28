/**
 * Registry of all available team page modules.
 * icon: lucide-react component name (string), resolved at render time.
 */
export const MODULE_REGISTRY = {
  hero: {
    label: 'Portada',
    icon: 'Flag',
    description: 'Nombre, descripción y redes sociales del equipo',
    defaultW: 12, defaultH: 1, minW: 6,
    defaultConfig: { showLogo: true, showSocials: true, tagline: '' }
  },
  stats: {
    label: 'Estadísticas',
    icon: 'BarChart2',
    description: 'Cifras automáticas: miembros, competiciones e inscripciones',
    defaultW: 12, defaultH: 1, minW: 4,
    defaultConfig: {}
  },
  members: {
    label: 'Miembros',
    icon: 'Users',
    description: 'Integrantes del equipo con roles y fotos de perfil',
    defaultW: 6, defaultH: 1, minW: 3,
    defaultConfig: { showRole: true, showPhoto: true, limit: 12, sortBy: 'joined' }
  },
  posts: {
    label: 'Publicaciones',
    icon: 'FileText',
    description: 'Entradas publicadas por el equipo',
    defaultW: 6, defaultH: 1, minW: 4,
    defaultConfig: { limit: 5, sortBy: 'newest', showAuthor: true, showDate: true }
  },
  competitions: {
    label: 'Competiciones',
    icon: 'Award',
    description: 'Historial de inscripciones con estado y fecha',
    defaultW: 12, defaultH: 1, minW: 6,
    defaultConfig: { limit: 8, statusFilter: 'all', showDate: true }
  },
  richtext: {
    label: 'Texto libre',
    icon: 'AlignLeft',
    description: 'Bloque editorial con formato completo: encabezados, listas, enlaces',
    defaultW: 12, defaultH: 1, minW: 4,
    defaultConfig: { title: '', content: '' }
  },
  customstats: {
    label: 'Cifras del equipo',
    icon: 'LayoutGrid',
    description: 'Define tus propios indicadores: trofeos, horas, cualquier valor',
    defaultW: 12, defaultH: 1, minW: 4,
    defaultConfig: {
      items: [
        { value: '', label: 'Trofeos', icon: 'Trophy' },
        { value: '', label: 'Temporadas', icon: 'Calendar' }
      ]
    }
  },
  gallery: {
    label: 'Galería de fotos',
    icon: 'Image',
    description: 'Cuadrícula de imágenes con visor a pantalla completa',
    defaultW: 12, defaultH: 1, minW: 6,
    defaultConfig: { limit: 12, columns: 3 }
  },
  robots: {
    label: 'Archivos del robot',
    icon: 'Cpu',
    description: 'Documentación y ficheros técnicos disponibles para descarga',
    defaultW: 6, defaultH: 1, minW: 4,
    defaultConfig: { limit: 6 }
  },
  countdown: {
    label: 'Cuenta atrás',
    icon: 'Clock',
    description: 'Tiempo restante hasta la próxima competición aprobada',
    defaultW: 6, defaultH: 1, minW: 4,
    defaultConfig: { label: 'Próxima competición' }
  },
  social: {
    label: 'Redes sociales',
    icon: 'Share2',
    description: 'Vínculos a los perfiles del equipo en redes y web',
    defaultW: 4, defaultH: 1, minW: 3,
    defaultConfig: {}
  }
};

export const MODULE_TYPES = Object.keys(MODULE_REGISTRY);
