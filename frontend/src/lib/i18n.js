/**
 * @fileoverview Frontend i18n initialization.
 *
 * Configures `i18next` + `react-i18next`, loads translation resources, detects
 * and persists the selected language, and applies the `lang` attribute on the
 * document root.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_KEY = 'robeurope:lang';
const SUPPORTED_LANGS = ['es', 'en', 'de'];

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage?.getItem(LANGUAGE_KEY) || '';
  } catch (error) {
    console.warn('No se pudo acceder a localStorage para leer el idioma', error);
    return '';
  }
};

const detectLanguage = () => {
  const stored = getStoredLanguage();
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  if (typeof window !== 'undefined') {
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    if (browser && SUPPORTED_LANGS.includes(browser)) return browser;
  }

  return 'es';
};

const applyDocumentLanguage = (lang) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang || 'es';
};

const resources = {
  es: {
    translation: {
      brand: 'RobEurope',
      languages: { es: 'ES', en: 'EN', de: 'DE' },
      nav: {
        home: 'Inicio',
        competitions: 'Competiciones',
        teams: 'Equipos',
        sponsors: 'Patrocinadores',
        streams: 'Streaming',
        contact: 'Contacto',
        terms: 'Términos',
        profile: 'Perfil',
        menu: 'Menú',
        userMenu: 'Menú de usuario',
        primaryNavigation: 'Navegación principal',
        myTeam: 'Mi equipo',
        theme: 'Tema',
        posts: 'Noticias',
        gallery: 'Galería',
        archives: 'Archivo',
        educationalCenters: 'Centros Educativos',
        feedback: 'Opiniones',
        login: 'Iniciar sesión',
        register: 'Registrarse',
        logout: 'Cerrar sesión',
        adminSection: 'Administración',
        manageCenters: 'Gestionar Centros',
        manageArchives: 'Gestionar Archivos',
        managePosts: 'Gestionar Posts',
        adminRequests: 'Solicitudes Admin'
      },
      status: {
        connected: 'Conectado',
        checkingSession: 'Comprobando sesión...'
      },
      buttons: {
        login: 'Entrar',
        register: 'Registro',
        logout: 'Cerrar sesión',
        save: 'Guardar',
        saveChanges: 'Guardar cambios',
        submitDemo: 'Enviar demo',
        send: 'Enviar',
        sending: 'Enviando…',
        createAccount: 'Crear cuenta',
        alreadyAccount: '¿Ya tienes cuenta?',
        noAccount: '¿No tienes cuenta?',
        goToLogin: 'Inicia sesión',
        goToRegister: 'Regístrate aquí',
        calendar: 'Calendario',
        docs: 'API Docs',
        changePhoto: 'Cambiar',
        uploading: 'Subiendo…',
        saving: 'Guardando…',
        creating: 'Creando…',
        entering: 'Entrando…',
        apply: 'Aplicar'
      },
      footer: {
        description:
          'RobEurope ofrece la mejor experiencia en robótica. Trabajamos con verdaderos profesionales —los mejores en su campo— para llevar innovación y excelencia a cada proyecto.',
        projects: 'PROYECTOS',
        competitions: 'Competiciones',
        teams: 'Equipos',
        streaming: 'Streaming',
        resources: 'RECURSOS',
        gallery: 'Galería',
        sponsors: 'Patrocinadores',
        feedback: 'Feedback',
        company: 'COMPAÑÍA',
        about: 'Sobre nosotros',
        contact: 'Contacto',
        terms: 'Términos',
        social: {
          twitter: 'Twitter',
          github: 'GitHub',
          linkedin: 'LinkedIn',
          facebook: 'Facebook',
          instagram: 'Instagram',
          youtube: 'YouTube'
        },
        copyright: 'Todos los derechos reservados.'
      },
      gallery: {
        galleryTitle: "Galería",
        galleryDescription: "Una colección de momentos de nuestro evento de robótica",
        adminUploadTitle: 'Subir foto a la galería',
        uploadImage: 'Imagen',
        uploadTitle: 'Título (opcional)',
        uploadDescription: 'Descripción (opcional)',
        uploadCta: 'Subir',
        uploading: 'Subiendo...',
        uploadMissingFile: 'Selecciona una imagen',
        uploadOk: 'Foto subida',
        loading: 'Cargando...',
        delete: 'Eliminar',
        deleting: 'Eliminando...',
        seeMore: 'Ver más',
        seeLess: 'Ver menos'
      },
      archives: {
        title: 'Archivo de Información',
        description: 'Documentos, archivos y textos informativos por competición',
        titleRequired: 'El título es obligatorio',
        empty: 'No hay archivos',
        fields: {
          title: 'Título',
          description: 'Descripción',
          content: 'Contenido',
          file: 'Archivo adjunto',
          competition: 'Competición',
          visibility: 'Visibilidad',
          allowedEmails: 'Emails permitidos',
          sortOrder: 'Orden'
        },
        visibility: {
          hidden: 'Oculto',
          public: 'Público',
          restricted: 'Restringido'
        },
        contentType: {
          label: 'Tipo de contenido',
          file: 'Archivo',
          text: 'Texto',
          mixed: 'Mixto'
        },
        actions: {
          create: 'Crear elemento',
          edit: 'Editar elemento',
          delete: 'Eliminar elemento',
          download: 'Descargar archivo'
        },
        messages: {
          created: 'Elemento creado correctamente',
          updated: 'Elemento actualizado',
          deleted: 'Elemento eliminado'
        },
        filters: {
          competitionAll: 'Todas las competiciones',
          visibilityAll: 'Todas las visibilidades'
        }
      },
      educationalCenters: {
        title: 'Centros Educativos',
        description: 'Instituciones educativas participantes',
        fields: {
          name: 'Nombre del centro',
          country: 'País',
          city: 'Ciudad',
          address: 'Dirección',
          website: 'Sitio web',
          phone: 'Teléfono',
          email: 'Email de contacto',
          logo: 'Logo',
          description: 'Descripción',
          admin: 'Administrador del centro'
        },
        status: {
          pending: 'Pendiente de aprobación',
          approved: 'Aprobado',
          rejected: 'Rechazado'
        },
        actions: {
          create: 'Registrar centro',
          edit: 'Editar centro',
          delete: 'Eliminar centro',
          approve: 'Aprobar centro',
          reject: 'Rechazar centro'
        },
        messages: {
          created: 'Centro educativo registrado correctamente',
          updated: 'Centro educativo actualizado',
          deleted: 'Centro educativo eliminado',
          approved: 'Centro educativo aprobado',
          rejected: 'Centro educativo rechazado'
        },
        filters: {
          countryAll: 'Todos los países',
          statusAll: 'Todos los estados'
        }
      },
      centerApproval: {
        title: 'Aprobación del centro',
        reason: {
          placeholder: 'Indica el motivo de la decisión...'
        }
      },
      feedback: {
        Title: "Opiniones",
        Description: "Opiniones de nuestros usuarios",
        roleSamuel: "Frontend Lead @ Google",
        reviewSamuel: "Este organizador de eventos de robótica realmente eleva cada taller. Las sesiones están bien estructuradas, son interactivas e increíblemente inspiradoras. Es el lugar ideal para explorar la robótica y obtener experiencia práctica real.",
        roleAngel: "Frontend Lead @ Google",
        reviewAngel: "Encontré una solución para todas mis necesidades de diseño con Creative Tim. ¡Los uso como freelancer en mis proyectos de hobby por diversión! ¡Y es realmente asequible, gente muy humilde!"
      }, 
      forms: {
        firstName: 'Nombre',
        lastName: 'Apellidos',
        username: 'Username',
        phone: 'Teléfono',
        email: 'Email',
        password: 'Contraseña',
        newPassword: 'Nueva contraseña',
        new_password: 'Nueva contraseña',
        confirm_password: 'Confirmar contraseña',
        code: 'Código',
        organization: 'Organización',
        message: 'Mensaje',
        country: 'País',
        name: 'Nombre',
        acceptTerms: 'Debes aceptar los términos y condiciones',
        passwordsDontMatch: 'Las contraseñas no coinciden',
        passwordTooWeak: 'La contraseña es demasiado débil',
        passwordStrength: 'Fuerza',
        repeatPassword: 'Repetir contraseña'
      },
      placeholders: {
        emailExample: 'nombre@ejemplo.com',
        phoneExample: '+34 600 000 000',
        nameExample: 'Juan',
        lastNameExample: 'Pérez',
        usernameExample: 'juanperez',
        passwordExample: '••••••••'
      },
      common: {
        save: 'Guardar',
        saving: 'Guardando...',
        delete: 'Eliminar',
        cancel: 'Cancelar',
        edit: 'Editar',
        close: 'Cerrar',
        loading: 'Cargando...',
        skipToContent: 'Saltar al contenido',
        adminModeActive: 'Modo admin activo',
        backendOfflineBanner: 'Backend apagado para ahorrar recursos. Se muestran datos de ejemplo (mockup) y funcionalidades recortadas.',
        showPassword: 'Mostrar contraseña',
        hidePassword: 'Ocultar contraseña',
        create: 'Crear',
        approve: 'Aprobar',
        reject: 'Rechazar'
      },
      status: {
        label: 'Estado'
      },
      admin: {
        centers: {
          title: 'Gestionar Centros Educativos',
          description: 'Administra los centros educativos registrados',
          create: 'Crear Centro',
          edit: 'Editar Centro',
          search: 'Buscar centros...',
          empty: 'No hay centros',
          approved: 'Centro aprobado',
          rejected: 'Centro rechazado',
          deleted: 'Centro eliminado',
          updated: 'Centro actualizado',
          created: 'Centro creado',
          confirmDelete: '¿Eliminar este centro?',
          rejectReason: 'Motivo del rechazo:',
          status: {
            pending: 'Pendiente',
            approved: 'Aprobado',
            rejected: 'Rechazado'
          },
          filter: {
            all: 'Todos',
            pending: 'Pendientes',
            approved: 'Aprobados',
            rejected: 'Rechazados'
          },
          form: {
            name: 'Nombre',
            city: 'Ciudad',
            email: 'Email',
            website: 'Sitio web',
            description: 'Descripción'
          },
          centerRegistrationsTitle: 'Solicitudes de competición del centro',
          centerRegistrationsDesc: 'Aprueba o rechaza las solicitudes de equipos de tu centro.',
          noRegistrations: 'No hay solicitudes pendientes.',
          competitionLabel: 'Competición',
          centerStudentsTitle: 'Alumnos del centro',
          centerStudentsDesc: 'Usuarios asociados a tu centro educativo.',
          noStudents: 'No hay alumnos asociados.',
          centerTeamsTitle: 'Equipos del centro',
          centerTeamsDesc: 'Equipos asociados a tu centro educativo.',
          noTeams: 'No hay equipos asociados.',
          confirmRemoveUser: '¿Eliminar este alumno del centro?',
          confirmRemoveTeam: '¿Eliminar este equipo del centro?',
          centerApprovedReason: 'Aprobado por el centro',
          centerRejectReason: 'Motivo del rechazo:'
        },
        archives: {
          title: 'Gestionar Archivos',
          description: 'Administra los archivos del centro',
          upload: 'Subir Archivo',
          edit: 'Editar Archivo',
          search: 'Buscar archivos...',
          empty: 'No hay archivos',
          deleted: 'Archivo eliminado',
          updated: 'Archivo actualizado',
          created: 'Archivo creado',
          confirmDelete: '¿Eliminar este archivo?',
          types: {
            document: 'Documento',
            image: 'Imagen',
            video: 'Video',
            other: 'Otro'
          },
          visibility: {
            public: 'Público',
            restricted: 'Restringido',
            hidden: 'Oculto'
          },
          form: {
            title: 'Título',
            type: 'Tipo',
            competition: 'Competición',
            noCompetition: '-- Sin competición --',
            year: 'Año',
            visibility: 'Visibilidad',
            file: 'Archivo',
            description: 'Descripción',
            allowedEmails: 'Emails permitidos',
            emailsPlaceholder: 'email1@ejemplo.com, email2@ejemplo.com',
            emailsHelp: 'Separa los emails con comas. Solo estos usuarios podrán ver el archivo.'
          }
        },
        requests: {
          title: 'Solicitudes de Administrador de Centro',
          description: 'Gestiona las solicitudes de usuarios para ser administradores de centro',
          empty: 'No hay solicitudes',
          approved: 'Solicitud aprobada',
          rejected: 'Solicitud rechazada',
          rejectReason: 'Motivo del rechazo:',
          reason: 'Motivo',
          requestedAt: 'Solicitado',
          status: {
            pending: 'Pendiente',
            approved: 'Aprobada',
            rejected: 'Rechazada'
          },
          filter: {
            pending: 'Pendientes',
            approved: 'Aprobadas',
            rejected: 'Rechazadas'
          },
          type: {
            create: 'Crear centro',
            join: 'Unirse a centro'
          }
        },
        posts: {
          title: 'Gestión de Posts',
          description: 'Crea, edita y elimina publicaciones del sistema.',
          create: 'Nuevo Post',
          edit: 'Editar Post',
          searchPlaceholder: 'Buscar posts...',
          titleLabel: 'Título',
          contentLabel: 'Contenido',
          pinPost: 'Fijar post',
          backendOfflineBanner: 'Backend is off to save resources. The UI shows sample data (mockup) with reduced functionality.',
          tableTitle: 'Título',
          tableAuthor: 'Autor',
          tableStatus: 'Estado',
          tableActions: 'Acciones',
          noPosts: 'No hay posts para mostrar.',
          confirmDelete: '¿Eliminar este post?',
          pinned: 'Fijado'
        }
      },
      actions: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        confirmDelete: '¿Estás seguro de eliminar este registro?'
      },
      charts: {
        backendOfflineBanner: 'Backend ist zur Ressourcenschonung deaktiviert. Es werden Beispieldaten (Mockup) mit eingeschränkten Funktionen angezeigt.',
        empty: 'No hay datos disponibles'
      },
      theme: {
        toggle: 'Cambiar tema',
        light: 'Claro',
        dark: 'Oscuro',
        system: 'Sistema'
      },
      auth: {
        orContinueWith: 'O continuar con',
        orSignUpWith: 'O registrarte con',
        signInWithLdap: 'Iniciar sesión con LDAP',
        backToLogin: 'Volver al inicio de sesión'
      },
      forgot: {
        tagline: 'RECUPERAR',
        title: 'Recuperar contraseña',
        description: 'Te enviaremos un código de un solo uso para restablecerla.',
        description2: 'Introduce el código y tu nueva contraseña.',
        sent: 'Te hemos enviado un código de un solo uso si el correo existe.',
        error: 'Error al solicitar la recuperación',
        reset_success: 'Contraseña actualizada correctamente.',
        reset_error: 'Código inválido o expirado'
      },
      notFound: {
        subtitle: '¿Estás perdido?',
        message: 'Parece que la página que buscas no existe. Tal vez escribiste mal la dirección o la página se ha movido.',
        backHome: 'Volver al inicio',
        badge: 'Página no encontrada',
        title: 'Ups…',
        description: 'La ruta que buscas no existe o ha cambiado. Puedes volver atrás o ir al inicio.',
        goBack: 'Volver',
        goHome: 'Ir al inicio',
        robotHint: 'Mi radar no detecta esa página.'
      },
      sponsors: {
        title: 'Sponsors',
        subtitle: 'Gestiona los sponsors del evento',
        create: 'Nuevo Sponsor',
        edit: 'Editar Sponsor',
        createDesc: 'Añade un nuevo sponsor al evento',
        editDesc: 'Modifica los datos del sponsor',
        form: {
          name: 'Nombre',
          logo: 'URL del Logo',
          website: 'Sitio Web'
        },
        empty: 'No hay sponsors',
        emptyDesc: 'Comienza añadiendo tu primer sponsor',
        created: 'Creado',
        logo: 'Logo',
        website: 'Website',
        id: 'ID'
      },
      posts: {
        title: 'Noticias',
        subtitle: 'Mantente al día con las últimas actualizaciones',
        search: 'Buscar noticias...',
        create: 'Crear Post',
        createTitle: 'Crear Nuevo Post',
        form: {
          title: 'Título',
          content: 'Contenido',
          image: 'Imagen'
        },
        empty: 'No hay noticias todavía.',
        created: 'Post creado exitosamente',
        error: 'Error al procesar la solicitud',
        confirmDelete: '¿Estás seguro de que quieres eliminar este post?',
        deleted: 'Post eliminado',
        pinned: 'Fijado',
        unpinned: 'Desfijado',
        comments: 'Comentarios',
        noComments: 'No hay comentarios todavía.',
        writeComment: 'Escribe un comentario...'
      },
      teams: {
        title: 'Equipos',
        subtitle: 'Descubre y únete a los mejores equipos de robótica',
        create: 'Crear Equipo',
        createTitle: 'Crear nuevo equipo',
        form: {
          name: 'Nombre del equipo',
          description: 'Descripción',
          website: 'Sitio Web',
          country: 'País'
        },
        searchPlaceholder: 'Buscar equipos...',
        searchButton: 'Buscar',
        allCountries: 'Todos los países',
        members: 'Miembros',
        manage: 'Gestionar mi equipo',
        requestJoin: 'Solicitar Unirse',
        loginToJoin: 'Inicia sesión para unirte',
        noTeams: 'No se encontraron equipos.',
        feedback: {
          created: 'Equipo creado exitosamente',
          createError: 'No se pudo crear el equipo',
          requestSent: 'Solicitud enviada',
          requestError: 'No se pudo enviar la solicitud'
        }
      },
      home: {
        hero: {
          tagline: 'Robótica educativa europea',
          title: 'RobEurope 2025 · la liga continental de robótica educativa',
          description:
            'Streaming oficial, datos en tiempo real y APIs abiertas para que cada instituto pueda diseñar, simular y desplegar su robot.',
          primaryCta: 'Calendario',
          secondaryCta: 'API Docs'
        },
        callouts: {
          nextQualifier: { label: 'Siguiente clasificatorio', fallback: 'Por anunciar' },
          streaming: { label: 'Streaming activo', fallback: 'Off-line' },
          teams: { label: 'Equipos registrados', detail: 'Edición 2025' }
        },
        locked:
          'Para ver el calendario real y las estadísticas de equipos, inicia sesión. Estas secciones usan los mismos endpoints protegidos del backend.',
        pillars: {
          stem: {
            title: 'STEM aplicado',
            body: 'Retos reales de mecatrónica, IA y visión computacional.'
          },
          europe: {
            title: 'Europa conectada',
            body: 'Institutos de varios países sincronizados en una misma liga.'
          },
          impact: {
            title: 'Impacto social',
            body: 'Programas públicos, becas y participación femenina.'
          }
        },
        pillarLabel: 'Pilar',
        loading: 'Sincronizando con la API...',
        error: 'No se pudo cargar la información',
        howItWorks: {
          title: "Cómo Funciona",
          description: "Participar en RobEurope es muy sencillo. Sigue estos pasos para comenzar tu viaje en la competición.",
          steps: {
            register: {
              title: "Regístrate",
              description: "Crea tu cuenta en RobEurope para acceder a todas las funcionalidades."
            },
            team: {
              title: "Forma un Equipo",
              description: "Únete a un equipo existente o crea uno nuevo con tus compañeros."
            },
            enroll: {
              title: "Inscríbete",
              description: "Busca competiciones activas y registra a tu equipo para participar."
            },
            compete: {
              title: "Compite y Gana",
              description: "Demuestra tus habilidades, sube en el ranking y gana premios."
            }
          }
        },
        stats: {
          teams: "Equipos Activos",
          competitions: "Competiciones Anuales",
          viewers: "Espectadores",
          countries: "Países"
        },
        latest: {
          title: "Últimas Novedades",
          description: "Mantente al día con las últimas noticias y competiciones de la liga.",
          news: "Noticias",
          viewAll: "Ver todas",
          competitions: "Competiciones",
          viewCalendar: "Ver calendario"
        },
        cta: {
          title: "¿Listo para competir?",
          description: "Únete a la comunidad de robótica más grande de Europa y demuestra tus habilidades.",
          button: "Registrarse Ahora"
        }
      },
      competitions: {
        hero: {
          tagline: 'Circuito oficial',
          title: 'Competiciones RobEurope',
          description:
            'Consulta la API para conocer las fechas de clasificación, comentaristas y reglamento técnico. Esta vista usa exactamente los endpoints protegidos del backend Express.'
        },
        locked: 'Inicia sesión para consumir /api/competitions y mostrar el calendario real.',
        loading: 'Sincronizando calendario...',
        error: 'Error al sincronizar competiciones.',
        empty: 'No hay competiciones registradas en la base de datos todavía.',
        featured: 'Streaming destacado',
        timelineLabel: 'Timeline',
        timelineTitle: 'Hitos confirmados',
        inquiry:
          '¿Quieres organizar una parada RobEurope en tu país? <ContactLink>Escríbenos en la sección de contacto</ContactLink> o envía tus datos a <MailLink>partnerships@robeurope.eu</MailLink>. También puedes seguir las actualizaciones en <TermsLink>nuestro portal de términos</TermsLink>.',
        card: {
          descriptionFallback: 'Prueba oficial RobEurope',
          start: 'Inicio',
          status: 'Estado',
          venue: 'Sede',
          teams: 'Equipos',
          tbd: 'Por definir',
          venueFallback: 'Multi-sede'
        },
        noDescription: 'Sin descripción disponible.',
        viewDetails: 'Ver Detalles',
        create: 'Crear Competición',
        createTitle: 'Nueva Competición',
        form: {
          title: 'Título',
          description: 'Descripción',
          location: 'Ubicación',
          startDate: 'Fecha Inicio',
          endDate: 'Fecha Fin',
          maxTeams: 'Máx. Equipos',
          isActive: 'Marcar como competición activa (desactivará otras)'
        },
        activeBadge: 'Activa',
        restrictedBadge: 'Acceso Restringido',
        restrictedMessage: 'Debes ser un participante aprobado en esta competición para ver los streams y detalles adicionales.',
        streamRestricted: 'Acceso restringido (Regístrate para ver)',
        noStreams: 'No hay streams activos para esta competición.',
        loadError: 'Error al cargar competiciones.',
        createError: 'Error al crear competición',
        noActive: 'No hay competiciones activas en este momento.',
        searchPlace: 'Nombre, ciudad...',
        onlyActive: 'Solo activas',
        onlyFavorites: 'Solo favoritos',
        // Action labels
        active: 'Activa',
        setActive: 'Marcar activa',
        setActiveError: 'No se pudo marcar como activa',
        removeFavorite: 'Quitar de favoritos',
        addFavorite: 'Añadir a favoritos',
        deactivate: 'Desactivar',
        // Detail page
        detail: {
          back: 'Volver',
          share: 'Compartir',
          linkCopied: 'Enlace copiado',
          linkCopiedDesc: 'El enlace a la competición ha sido copiado al portapapeles.',
          loading: 'Cargando...',
          notFound: 'Competición no encontrada',
          aboutEvent: 'Sobre el evento',
          liveStreams: 'Streams en vivo',
          watchOnPlatform: 'Ver en plataforma',
          participatingTeams: 'Equipos Participantes',
          noTeamsYet: 'No hay equipos registrados aún.',
          noLocation: 'Sin ubicación',
          publicFiles: 'Archivos Públicos',
          information: 'Información',
          organizer: 'Organizador',
          website: 'Website',
          teamsCount: 'Equipos'
        }
      },
      streams: {
        title: 'Streams',
        subtitle: 'Visualiza todos los streams de las competiciones',
        loading: 'Cargando streams...',
        error: 'Error:',
        noStreams: 'No hay streams disponibles.',
        noCenter: 'Sin centro educativo',
        created: 'Creado',
        status: {
          live: 'En vivo',
          offline: 'Offline',
          scheduled: 'Programado'
        },
        team: 'Equipo',
        competition: 'Competición',
        watch: 'Ver Stream'
      },
      contact: {
        hero: {
          tagline: 'Contacto',
          title: 'Hablemos de RobEurope',
          description:
            'Canalizamos preguntas sobre licencias, sponsors, voluntariado y workshops. Si necesitas permisos para consumir la API en producción, rellena el formulario y te enviaremos claves dedicadas.'
        },
        channels: [
          { title: 'Mentores & coaches', detail: 'mentors@robeurope.eu', note: 'Registro de formadores oficiales' },
          { title: 'Sponsors & prensa', detail: 'press@robeurope.eu', note: 'Dossieres y media kit' },
          { title: 'Soporte técnico', detail: '+34 900 123 456', note: 'Infraestructura digital & APIs' }
        ],
        form: {
          title: 'Programa tu llamada',
          description: 'No envía datos reales; es un mockup para validar el diseño y explicar cómo el backend recibe la información.',
          success: 'Gracias, nos pondremos en contacto muy pronto.',
          submit: 'Enviar demo'
        },
        contactUs: "Ponte en contacto",
        contactUsDesc: "Estamos aquí para ayudarte. Rellena el formulario y nos pondremos en contacto contigo lo antes posible.",
        sentTitle: "¡Mensaje Enviado!",
        sentDesc: "Gracias por contactarnos. Te responderemos a la brevedad posible.",
        sendAnother: "Enviar otro mensaje",
        support: "Soporte 24/7 para equipos",
        placeholders: {
          name: "Tu nombre",
          email: "tu@email.com"
        }
      },
      profile: {
        title: 'Mi Perfil',
        overview: 'Resumen',
        personalInfo: 'Información Personal',
        bio: 'Biografía',
        bioEmpty: 'Sin biografía',
        username: 'Nombre de usuario',
        country: 'País',
        educationalCenter: 'Centro educativo',
        noEducationalCenter: 'Sin centro asignado',
        centerAdminBadge: 'Administrador',
        studentBadge: 'Alumno',
        centersLoadError: 'No se pudieron cargar los centros.',
        photo: 'Foto de Perfil',
        heroTagline: 'Cuenta vinculada',
        heroNote: 'Los cambios sincronizan con /users/me.',
        feedback: {
          success: 'Perfil actualizado correctamente.',
          error: 'Error al actualizar el perfil.',
          photoSuccess: 'Foto actualizada correctamente.',
          photoError: 'No se pudo subir la foto.'
        },
        countriesError: 'No se pudieron cargar los países. Comprueba la conexión con la API.'
      },
      login: {
        tagline: 'Portal RobEurope',
        title: 'Inicia sesión',
        description: 'Usa las credenciales emitidas por el backend (/auth/login) para generar tu token JWT.',
        noAccount: '¿No tienes cuenta?',
        registerLink: 'Regístrate aquí',
        forgot: '¿Olvidaste tu contraseña?',
        error: 'Credenciales inválidas'
      },
      register: {
        tagline: 'Programa nuevos equipos',
        title: 'Crea tu cuenta',
        description: 'Los datos se envían al endpoint /auth/register para emitir un token y almacenarte en la base de datos.',
        hasAccount: '¿Ya tienes cuenta?',
        loginLink: 'Inicia sesión',
        acceptTerms: 'Acepto los',
        studentCenterLabel: 'Centro educativo (opcional)',
        studentCenterPlaceholder: '-- No indicar centro --',
        studentCenterHelp: 'Opcional. Podrás cambiarlo más adelante en tu perfil.',
        wantsCenterAdmin: '¿Quieres administrar un centro educativo?',
        centerAdminDescription: 'Como administrador de centro podrás gestionar equipos, streamings y archivos de tu institución.',
        selectExistingCenter: 'Seleccionar centro existente',
        noCenter: '-- Selecciona un centro --',
        orCreateCenter: '¿No encuentras tu centro? Créalo aquí',
        createNewCenter: 'Crear nuevo centro educativo',
        centerName: 'Nombre del centro',
        centerNamePlaceholder: 'IES / Colegio / Universidad...',
        centerCity: 'Ciudad',
        centerCityPlaceholder: 'Madrid, Barcelona...',
        centerEmail: 'Email de contacto',
        centerWebsite: 'Sitio web',
        centerPendingApproval: 'El centro quedará pendiente de aprobación por un super administrador.',
        centerNameRequired: 'El nombre del centro es requerido'
      },
      general: {
        countriesLoading: 'Cargando países…',
        search: 'Buscar'
      },
      myTeam: {
        title: "Mi Equipo",
        createTitle: "Crear un Equipo",
        createDesc: "No perteneces a ningún equipo. Crea uno nuevo para empezar.",
        form: {
          name: "Nombre del Equipo",
          city: "Ciudad",
          country: "País (ID)",
          institution: "Institución / Centro",
          description: "Descripción",
          website: "Sitio Web",
          streamUrl: "URL del Stream (Twitch/YouTube)",
          submitCreate: "Crear Equipo",
          submitSave: "Guardar Cambios",
          saveUrl: "Guardar URL",
          centerDescription: "Conecta tu equipo a un centro educativo existente o crea uno nuevo.",
          selectCenter: "Seleccionar centro educativo",
          noCenter: "-- Sin centro educativo --",
          orCreateCenter: "¿No encuentras tu centro?",
          createNewCenter: "Crear nuevo centro",
          onlyAdminsCanCreate: "Solo los administradores de centro pueden crear nuevos centros educativos."
        },
        tabs: {
          overview: "Resumen",
          members: "Miembros",
          competitions: "Competiciones",
          settings: "Ajustes"
        },
        roles: {
          owner: "Propietario",
          member: "Miembro"
        },
        actions: {
          leave: "Salir del Equipo",
          delete: "Eliminar Equipo",
          removeMember: "Eliminar",
          invite: "Invitar",
          approve: "Aprobar",
          startStream: "Iniciar LIVE",
          stopStream: "Detener LIVE",
          register: "Solicitar Inscripción"
        },
        overview: {
          about: "Sobre el equipo",
          noDesc: "Sin descripción",
          teamId: "ID de Equipo",
          stats: "Estadísticas",
          membersCount: "Miembros",
          compsCount: "Competiciones"
        },
        members: {
          title: "Miembros del Equipo",
          desc: "Lista de usuarios que forman parte de este equipo.",
          userPrefix: "Usuario #",
          noMembers: "No hay miembros.",
          inviteTitle: "Invitar Miembros",
          inviteDesc: "Busca usuarios o invita por email.",
          searchUser: "Buscar usuario",
          inviteEmail: "Invitar por Email",
          requestsTitle: "Solicitudes de Acceso",
          requestsDesc: "Usuarios que quieren unirse.",
          noRequests: "No hay solicitudes pendientes."
        },
        competitions: {
          registerTitle: "Inscribirse en Competición",
          selectLabel: "Seleccionar Competición",
          selectPlaceholder: "-- Seleccionar --",
          activeTitle: "Inscripciones Activas",
          noRegistrations: "No hay inscripciones registradas.",
          compPrefix: "Competición #",
          reason: "Motivo:",
          centerReason: "Centro:",
          status: {
            pending: "Pendiente",
            approved: "Aprobado",
            rejected: "Rechazado"
          }
        },
        settings: {
          editTitle: "Editar Información",
          editDesc: "Actualiza los datos públicos de tu equipo.",
          streamTitle: "Configuración de Streaming",
          streamDesc: "Gestiona la emisión en directo de tu equipo.",
          streamStatus: "Estado de Emisión",
          streamStatusDesc: "Inicia la emisión para aparecer en vivo.",
          dangerZone: "Zona de Peligro",
          deleteWarning: "Eliminar el equipo borrará todos los datos, miembros y registros asociados. Esta acción no se puede deshacer."
        },
        feedback: {
          created: "Equipo creado exitosamente",
          createError: "Error al crear equipo",
          saved: "Cambios guardados",
          saveError: "No se pudo guardar",
          invited: "Invitación enviada a {{username}}",
          inviteError: "No se pudo invitar",
          emailInvited: "Invitación enviada por email",
          approved: "Solicitud aprobada",
          approveError: "No se pudo aprobar",
          confirmRemoveMember: "¿Eliminar a este miembro?",
          memberRemoved: "Miembro eliminado",
          removeMemberError: "No se pudo eliminar al miembro",
          confirmLeave: "¿Seguro que quieres salir del equipo?",
          left: "Has salido del equipo",
          leaveError: "No se pudo salir del equipo",
          confirmDelete: "¿ESTÁS SEGURO? Esta acción no se puede deshacer.",
          deleted: "Equipo eliminado",
          deleteError: "No se pudo eliminar",
          registrationSent: "Solicitud de registro enviada",
          registrationError: "No se pudo enviar la solicitud",
          streamUrlMissing: "Debes guardar una URL de stream primero",
          streamStarted: "¡Emisión iniciada!",
          streamStopped: "Emisión detenida",
          streamError: "Error al iniciar stream"
        }
      },
      team: {
        chat: {
          tab: 'Chat',
          title: 'Chat de Equipo'
        }
      }
    }
  },
  en: {
    translation: {
      brand: 'RobEurope',
      languages: { es: 'ES', en: 'EN', de: 'DE' },
      nav: {
        home: 'Home',
        competitions: 'Competitions',
        teams: 'Teams',
        sponsors: 'Sponsors',
        streams: 'Streaming',
        contact: 'Contact',
        terms: 'Terms',
        profile: 'Profile',
        menu: 'Menu',
        userMenu: 'User menu',
        primaryNavigation: 'Primary navigation',
        myTeam: 'My Team',
        theme: 'Theme',
        posts: 'News',
        gallery: 'Gallery',
        archives: 'Archive',
        educationalCenters: 'Educational Centers',
        feedback: 'Feedback',
        login: 'Log in',
        register: 'Register',
        logout: 'Log out',
        adminSection: 'Administration',
        manageCenters: 'Manage Centers',
        manageArchives: 'Manage Archives',
        managePosts: 'Manage Posts',
        adminRequests: 'Admin Requests'
      },
      status: {
        connected: 'Online',
        checkingSession: 'Checking session...'
      },
      buttons: {
        login: 'Login',
        register: 'Register',
        logout: 'Log out',
        save: 'Save',
        saveChanges: 'Save changes',
        submitDemo: 'Send demo',
        send: 'Send',
        sending: 'Sending…',
        createAccount: 'Create account',
        alreadyAccount: 'Already have an account?',
        noAccount: 'Don\'t have an account?',
        goToLogin: 'Sign in',
        goToRegister: 'Register here',
        calendar: 'Calendar',
        docs: 'API Docs',
        changePhoto: 'Update',
        uploading: 'Uploading…',
        saving: 'Saving…',
        creating: 'Creating…',
        entering: 'Logging in…',
        apply: 'Apply'
      },
      footer: {
        description:
          'RobEurope offers the best experience in robotics. We work with true professionals —the best in their field— to bring innovation and excellence to every project.',
        projects: 'PROJECTS',
        competitions: 'Competitions',
        teams: 'Teams',
        streaming: 'Streaming',
        resources: 'RESOURCES',
        gallery: 'Gallery',
        sponsors: 'Sponsors',
        feedback: 'Feedback',
        company: 'COMPANY',
        about: 'About Us',
        contact: 'Contact',
        terms: 'Terms',
        social: {
          twitter: 'Twitter',
          github: 'GitHub',
          linkedin: 'LinkedIn',
          facebook: 'Facebook',
          instagram: 'Instagram',
          youtube: 'YouTube'
        },
        copyright: 'All rights reserved.'
      },
      gallery: {
        galleryTitle: "Gallery",
        galleryDescription: "A collection of our robotics event moments",
        adminUploadTitle: 'Upload photo to gallery',
        uploadImage: 'Image',
        uploadTitle: 'Title (optional)',
        uploadDescription: 'Description (optional)',
        uploadCta: 'Upload',
        uploading: 'Uploading...',
        uploadMissingFile: 'Select an image',
        uploadOk: 'Photo uploaded',
        loading: 'Loading...',
        delete: 'Delete',
        deleting: 'Deleting...',
        seeMore: 'See more',
        seeLess: 'See less'
      },
      archives: {
        title: 'Information Archive',
        description: 'Documents, files and informative texts by competition',
        titleRequired: 'Title is required',
        empty: 'No files found',
        fields: {
          title: 'Title',
          description: 'Description',
          content: 'Content',
          file: 'Attached file',
          competition: 'Competition',
          visibility: 'Visibility',
          allowedEmails: 'Allowed emails',
          sortOrder: 'Sort order'
        },
        visibility: {
          hidden: 'Hidden',
          public: 'Public',
          restricted: 'Restricted'
        },
        contentType: {
          label: 'Content type',
          file: 'File',
          text: 'Text',
          mixed: 'Mixed'
        },
        actions: {
          create: 'Create item',
          edit: 'Edit item',
          delete: 'Delete item',
          download: 'Download file'
        },
        messages: {
          created: 'Item created successfully',
          updated: 'Item updated',
          deleted: 'Item deleted'
        },
        filters: {
          competitionAll: 'All competitions',
          visibilityAll: 'All visibilities'
        }
      },
      educationalCenters: {
        title: 'Educational Centers',
        description: 'Participating educational institutions',
        fields: {
          name: 'Center name',
          country: 'Country',
          city: 'City',
          address: 'Address',
          website: 'Website',
          phone: 'Phone',
          email: 'Contact email',
          logo: 'Logo',
          description: 'Description',
          admin: 'Center administrator'
        },
        status: {
          pending: 'Pending approval',
          approved: 'Approved',
          rejected: 'Rejected'
        },
        actions: {
          create: 'Register center',
          edit: 'Edit center',
          delete: 'Delete center',
          approve: 'Approve center',
          reject: 'Reject center'
        },
        messages: {
          created: 'Educational center registered successfully',
          updated: 'Educational center updated',
          deleted: 'Educational center deleted',
          approved: 'Educational center approved',
          rejected: 'Educational center rejected'
        },
        filters: {
          countryAll: 'All countries',
          statusAll: 'All statuses'
        }
      },
      centerApproval: {
        title: 'Center Approval',
        reason: {
          placeholder: 'Enter the reason for the decision...'
        }
      },
      feedback: {
        Title: "Feedback",
        Description: "Our users' opinions",
        roleSamuel: "Frontend Lead @ Google",
        reviewSamuel: "This robotics event organizer truly elevates every workshop. The sessions are well-structured, interactive, and incredibly inspiring. It’s the ideal place to explore robotics and gain real hands-on experience.",
        roleAngel: "Frontend Lead @ Google",
        reviewAngel: "I found a solution to all my design needs from Creative Tim. I use them as a freelancer in my hobby projects for fun! And it's really affordable, very humble guys!!!"
      },
      forms: {
        firstName: 'First name',
        lastName: 'Last name',
        username: 'Username',
        phone: 'Phone',
        email: 'Email',
        password: 'Password',
        newPassword: 'New password',
        new_password: 'New password',
        confirm_password: 'Confirm password',
        code: 'Code',
        organization: 'Organization',
        message: 'Message',
        country: 'Country',
        name: 'Name',
        acceptTerms: 'You must accept the terms and conditions',
        passwordsDontMatch: 'Passwords do not match',
        passwordTooWeak: 'Password is too weak',
        passwordStrength: 'Strength',
        repeatPassword: 'Repeat password'
      },
      placeholders: {
        emailExample: 'name@example.com',
        phoneExample: '+1 234 567 890',
        nameExample: 'John',
        lastNameExample: 'Doe',
        usernameExample: 'johndoe',
        passwordExample: '••••••••'
      },
      common: {
        save: 'Save',
        saving: 'Saving...',
        delete: 'Delete',
        cancel: 'Cancel',
        edit: 'Edit',
        close: 'Close',
        loading: 'Loading...',
        skipToContent: 'Skip to content',
        adminModeActive: 'Admin mode active',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        create: 'Create',
        approve: 'Approve',
        reject: 'Reject'
      },
      status: {
        label: 'Status'
      },
      admin: {
        centers: {
          title: 'Manage Educational Centers',
          description: 'Manage registered educational centers',
          create: 'Create Center',
          edit: 'Edit Center',
          search: 'Search centers...',
          empty: 'No centers found',
          approved: 'Center approved',
          rejected: 'Center rejected',
          deleted: 'Center deleted',
          updated: 'Center updated',
          created: 'Center created',
          confirmDelete: 'Delete this center?',
          rejectReason: 'Rejection reason:',
          status: {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected'
          },
          filter: {
            all: 'All',
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected'
          },
          form: {
            name: 'Name',
            city: 'City',
            email: 'Email',
            website: 'Website',
            description: 'Description'
          },
          centerRegistrationsTitle: 'Center competition requests',
          centerRegistrationsDesc: 'Approve or reject team requests from your center.',
          noRegistrations: 'No pending requests.',
          competitionLabel: 'Competition',
          centerStudentsTitle: 'Center students',
          centerStudentsDesc: 'Users associated with your educational center.',
          noStudents: 'No students associated.',
          centerTeamsTitle: 'Center teams',
          centerTeamsDesc: 'Teams associated with your educational center.',
          noTeams: 'No teams associated.',
          confirmRemoveUser: 'Remove this student from the center?',
          confirmRemoveTeam: 'Remove this team from the center?',
          centerApprovedReason: 'Approved by the center',
          centerRejectReason: 'Rejection reason:'
        },
        archives: {
          title: 'Manage Archives',
          description: 'Manage center archives',
          upload: 'Upload File',
          edit: 'Edit File',
          search: 'Search files...',
          empty: 'No files found',
          deleted: 'File deleted',
          updated: 'File updated',
          created: 'File created',
          confirmDelete: 'Delete this file?',
          types: {
            document: 'Document',
            image: 'Image',
            video: 'Video',
            other: 'Other'
          },
          visibility: {
            public: 'Public',
            restricted: 'Restricted',
            hidden: 'Hidden'
          },
          form: {
            title: 'Title',
            type: 'Type',
            competition: 'Competition',
            noCompetition: '-- No competition --',
            year: 'Year',
            visibility: 'Visibility',
            file: 'File',
            description: 'Description',
            allowedEmails: 'Allowed emails',
            emailsPlaceholder: 'email1@example.com, email2@example.com',
            emailsHelp: 'Separate emails with commas. Only these users can view the file.'
          }
        },
        requests: {
          title: 'Center Admin Requests',
          description: 'Manage user requests to become center administrators',
          empty: 'No requests found',
          approved: 'Request approved',
          rejected: 'Request rejected',
          rejectReason: 'Rejection reason:',
          reason: 'Reason',
          requestedAt: 'Requested',
          status: {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected'
          },
          filter: {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected'
          },
          type: {
            create: 'Create center',
            join: 'Join center'
          }
        },
        posts: {
          title: 'Post Management',
          description: 'Create, edit and delete system posts.',
          create: 'New Post',
          edit: 'Edit Post',
          searchPlaceholder: 'Search posts...',
          titleLabel: 'Title',
          contentLabel: 'Content',
          pinPost: 'Pin post',
          tableTitle: 'Title',
          tableAuthor: 'Author',
          tableStatus: 'Status',
          tableActions: 'Actions',
          noPosts: 'No posts to display.',
          confirmDelete: 'Delete this post?',
          pinned: 'Pinned'
        }
      },
      actions: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        confirmDelete: 'Are you sure you want to delete this record?'
      },
      charts: {
        empty: 'No data available'
      },
      theme: {
        toggle: 'Toggle theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      },
      auth: {
        orContinueWith: 'Or continue with',
        orSignUpWith: 'Or sign up with',
        signInWithLdap: 'Sign in with LDAP',
        backToLogin: 'Back to login'
      },
      forgot: {
        tagline: 'RECOVER',
        title: 'Recover password',
        description: 'We will send you a one-time code to reset it.',
        description2: 'Enter the code and your new password.',
        sent: 'We sent you a one-time code if the email exists.',
        error: 'Error requesting recovery',
        reset_success: 'Password updated successfully.',
        reset_error: 'Invalid or expired code'
      },
      notFound: {
        subtitle: 'Are you lost?',
        message: 'It seems the page you are looking for does not exist. Maybe you typed the address wrong or the page has moved.',
        backHome: 'Back to home',
        badge: 'Page not found',
        title: 'Oops…',
        description: "The page you're looking for doesn't exist or has moved. You can go back or return home.",
        goBack: 'Go back',
        goHome: 'Go home',
        robotHint: "My radar can't find that page."
      },
      sponsors: {
        title: 'Sponsors',
        subtitle: 'Manage event sponsors',
        create: 'New Sponsor',
        edit: 'Edit Sponsor',
        createDesc: 'Add a new sponsor to the event',
        editDesc: 'Modify sponsor data',
        form: {
          name: 'Name',
          logo: 'Logo URL',
          website: 'Website'
        },
        empty: 'No sponsors found',
        emptyDesc: 'Start by adding your first sponsor',
        created: 'Created',
        logo: 'Logo',
        website: 'Website',
        id: 'ID'
      },
      posts: {
        title: 'News',
        subtitle: 'Stay up to date with the latest updates',
        search: 'Search news...',
        create: 'Create Post',
        createTitle: 'Create New Post',
        form: {
          title: 'Title',
          content: 'Content',
          image: 'Image'
        },
        empty: 'No news yet.',
        created: 'Post created successfully',
        error: 'Error processing request',
        confirmDelete: 'Are you sure you want to delete this post?',
        deleted: 'Post deleted',
        pinned: 'Pinned',
        unpinned: 'Unpinned',
        comments: 'Comments',
        noComments: 'No comments yet.',
        writeComment: 'Write a comment...'
      },
      teams: {
        title: 'Teams',
        subtitle: 'Discover and join the best robotics teams',
        create: 'Create Team',
        createTitle: 'Create new team',
        form: {
          name: 'Team Name',
          description: 'Description',
          website: 'Website',
          country: 'Country'
        },
        searchPlaceholder: 'Search teams...',
        searchButton: 'Search',
        allCountries: 'All countries',
        members: 'Members',
        manage: 'Manage my team',
        requestJoin: 'Request to Join',
        loginToJoin: 'Log in to join',
        noTeams: 'No teams found.',
        feedback: {
          created: 'Team created successfully',
          createError: 'Could not create team',
          requestSent: 'Request sent',
          requestError: 'Could not send request'
        }
      },
      home: {
        hero: {
          tagline: 'European educational robotics',
          title: 'RobEurope 2025 · the continental educational robotics league',
          description:
            'Official streaming, real-time data and open APIs so every school can design, simulate and deploy its robot.',
          primaryCta: 'Calendar',
          secondaryCta: 'API Docs'
        },
        callouts: {
          nextQualifier: { label: 'Next qualifier', fallback: 'TBA' },
          streaming: { label: 'Live stream', fallback: 'Offline' },
          teams: { label: 'Registered teams', detail: '2025 season' }
        },
        locked:
          'Sign in to view the real competition calendar and team stats. These sections rely on the protected backend endpoints.',
        pillars: {
          stem: {
            title: 'Applied STEM',
            body: 'Real mechatronics, AI and computer vision challenges.'
          },
          europe: {
            title: 'Connected Europe',
            body: 'Schools from multiple countries synced in the same league.'
          },
          impact: {
            title: 'Social impact',
            body: 'Public programs, scholarships and female participation.'
          }
        },
        pillarLabel: 'Pillar',
        loading: 'Syncing with the API...',
        error: 'We could not load the information.',
        howItWorks: {
          title: "How it Works",
          description: "Participating in RobEurope is very simple. Follow these steps to start your journey in the competition.",
          steps: {
            register: {
              title: "Register",
              description: "Create your RobEurope account to access all features."
            },
            team: {
              title: "Form a Team",
              description: "Join an existing team or create a new one with your teammates."
            },
            enroll: {
              title: "Enroll",
              description: "Find active competitions and register your team to participate."
            },
            compete: {
              title: "Compete and Win",
              description: "Show off your skills, climb the ranking and win prizes."
            }
          }
        },
        stats: {
          teams: "Active Teams",
          competitions: "Annual Competitions",
          viewers: "Viewers",
          countries: "Countries"
        },
        latest: {
          title: "Latest News",
          description: "Stay up to date with the latest news and league competitions.",
          news: "News",
          viewAll: "View all",
          competitions: "Competitions",
          viewCalendar: "View calendar"
        },
        cta: {
          title: "Ready to compete?",
          description: "Join the largest robotics community in Europe and show your skills.",
          button: "Register Now"
        }
      },
      competitions: {
        hero: {
          tagline: 'Official circuit',
          title: 'RobEurope competitions',
          description:
            'Use the API to learn about qualifiers, casters and the technical rulebook. This view consumes the same secured endpoints as the backend.'
        },
        locked: 'Sign in to consume /api/competitions and display the real schedule.',
        loading: 'Syncing calendar...',
        error: 'Could not sync competitions.',
        empty: 'No competitions have been registered yet.',
        featured: 'Featured stream',
        timelineLabel: 'Timeline',
        timelineTitle: 'Confirmed milestones',
        inquiry:
          'Want to host a RobEurope stop in your country? <ContactLink>Reach out through the contact section</ContactLink> or email <MailLink>partnerships@robeurope.eu</MailLink>. You can also follow updates on <TermsLink>our terms portal</TermsLink>.',
        card: {
          descriptionFallback: 'Official RobEurope challenge',
          start: 'Start',
          status: 'Status',
          venue: 'Venue',
          teams: 'Teams',
          tbd: 'TBD',
          venueFallback: 'Multi-site'
        },
        noDescription: 'No description available.',
        viewDetails: 'View Details',
        create: 'Create Competition',
        createTitle: 'New Competition',
        form: {
          title: 'Title',
          description: 'Description',
          location: 'Location',
          startDate: 'Start Date',
          endDate: 'End Date',
          maxTeams: 'Max. Teams',
          isActive: 'Mark as active competition (will deactivate others)'
        },
        activeBadge: 'Active',
        restrictedBadge: 'Restricted Access',
        restrictedMessage: 'You must be an approved participant in this competition to view streams and additional details.',
        streamRestricted: 'Restricted Access (Register to view)',
        noStreams: 'No active streams for this competition.',
        loadError: 'Error loading competitions.',
        createError: 'Error creating competition',
        noActive: 'No active competitions at the moment.',
        searchPlace: 'Name, city...',
        onlyActive: 'Active only',
        onlyFavorites: 'Favorites only',
        // Action labels
        active: 'Active',
        setActive: 'Set active',
        setActiveError: 'Could not mark as active',
        removeFavorite: 'Remove from favorites',
        addFavorite: 'Add to favorites',
        deactivate: 'Deactivate',
        // Detail page
        detail: {
          back: 'Back',
          share: 'Share',
          linkCopied: 'Link copied',
          linkCopiedDesc: 'The competition link has been copied to the clipboard.',
          loading: 'Loading...',
          notFound: 'Competition not found',
          aboutEvent: 'About the event',
          liveStreams: 'Live Streams',
          watchOnPlatform: 'Watch on platform',
          participatingTeams: 'Participating Teams',
          noTeamsYet: 'No teams registered yet.',
          noLocation: 'No location',
          publicFiles: 'Public Files',
          information: 'Information',
          organizer: 'Organizer',
          website: 'Website',
          teamsCount: 'Teams'
        }
      },
      streams: {
        title: 'Streams',
        subtitle: 'Watch all competition streams',
        loading: 'Loading streams...',
        error: 'Error:',
        noStreams: 'No streams available.',
        noCenter: 'No educational center',
        created: 'Created',
        status: {
          live: 'Live',
          offline: 'Offline',
          scheduled: 'Scheduled'
        },
        team: 'Team',
        competition: 'Competition',
        watch: 'Watch Stream'
      },
      contact: {
        hero: {
          tagline: 'Contact',
          title: 'Let\'s talk about RobEurope',
          description:
            'We channel questions about licenses, sponsorships, volunteering and workshops. If you need production API access just fill the form and we will send dedicated keys.'
        },
        channels: [
          { title: 'Mentors & coaches', detail: 'mentors@robeurope.eu', note: 'Official trainer registry' },
          { title: 'Sponsors & press', detail: 'press@robeurope.eu', note: 'Media kit & dossiers' },
          { title: 'Technical support', detail: '+34 900 123 456', note: 'Digital infrastructure & APIs' }
        ],
        form: {
          title: 'Schedule your call',
          description: 'This does not send real data; it is a mockup to explain how the backend receives info.',
          success: 'Thanks! We will get back to you shortly.',
          submit: 'Send demo'
        },
        contactUs: "Get in touch",
        contactUsDesc: "We are here to help. Fill out the form and we will get back to you as soon as possible.",
        sentTitle: "Message Sent!",
        sentDesc: "Thank you for contacting us. We will respond shortly.",
        sendAnother: "Send another message",
        support: "24/7 Team Support",
        placeholders: {
          name: "Your name",
          email: "you@email.com"
        }
      },
      profile: {
        title: 'My Profile',
        overview: 'Overview',
        personalInfo: 'Personal Information',
        bio: 'Biography',
        bioEmpty: 'No biography provided',
        username: 'Username',
        country: 'Country',
        educationalCenter: 'Educational center',
        noEducationalCenter: 'No center assigned',
        centerAdminBadge: 'Administrator',
        studentBadge: 'Student',
        centersLoadError: 'Centers could not be loaded.',
        photo: 'Profile Photo',
        heroTagline: 'Linked account',
        heroNote: 'Changes sync with /users/me.',
        feedback: {
          success: 'Profile updated successfully.',
          error: 'There was an error updating your profile.',
          photoSuccess: 'Photo updated successfully.',
          photoError: 'Photo upload failed.'
        },
        countriesError: 'Countries could not be loaded. Check the API connection.'
      },
      login: {
        tagline: 'RobEurope portal',
        title: 'Sign in',
        description: 'Use the credentials issued by the backend (/auth/login) to generate your JWT token.',
        noAccount: 'Don\'t have an account?',
        registerLink: 'Register here',
        forgot: 'Forgot your password?',
        error: 'Invalid credentials'
      },
      register: {
        tagline: 'New teams program',
        title: 'Create your account',
        description: 'Data is sent to /auth/register to issue a token and store you in the database.',
        hasAccount: 'Already have an account?',
        loginLink: 'Sign in',
        acceptTerms: 'I accept the',
        studentCenterLabel: 'Educational center (optional)',
        studentCenterPlaceholder: '-- No center selected --',
        studentCenterHelp: 'Optional. You can change it later in your profile.',
        wantsCenterAdmin: 'Do you want to manage an educational center?',
        centerAdminDescription: 'As a center admin you can manage teams, streams and files for your institution.',
        selectExistingCenter: 'Select existing center',
        noCenter: '-- Select a center --',
        orCreateCenter: 'Can\'t find your center? Create it here',
        createNewCenter: 'Create new educational center',
        centerName: 'Center name',
        centerNamePlaceholder: 'High School / College / University...',
        centerCity: 'City',
        centerCityPlaceholder: 'New York, London...',
        centerEmail: 'Contact email',
        centerWebsite: 'Website',
        centerPendingApproval: 'The center will be pending approval by a super admin.',
        centerNameRequired: 'Center name is required'
      },
      general: {
        countriesLoading: 'Loading countries…',
        search: 'Search'
      },
      myTeam: {
        title: "My Team",
        createTitle: "Create a Team",
        createDesc: "You don't belong to any team. Create a new one to start.",
        form: {
          name: "Team Name",
          city: "City",
          country: "Country (ID)",
          institution: "Institution / Center",
          description: "Description",
          website: "Website",
          streamUrl: "Stream URL (Twitch/YouTube)",
          submitCreate: "Create Team",
          submitSave: "Save Changes",
          saveUrl: "Save URL",
          centerDescription: "Connect your team to an existing educational center or create a new one.",
          selectCenter: "Select educational center",
          noCenter: "-- No educational center --",
          orCreateCenter: "Can't find your center?",
          createNewCenter: "Create new center",
          onlyAdminsCanCreate: "Only center administrators can create new educational centers."
        },
        tabs: {
          overview: "Overview",
          members: "Members",
          competitions: "Competitions",
          settings: "Settings"
        },
        roles: {
          owner: "Owner",
          member: "Member"
        },
        actions: {
          leave: "Leave Team",
          delete: "Delete Team",
          removeMember: "Remove",
          invite: "Invite",
          approve: "Approve",
          startStream: "Start LIVE",
          register: "Request Registration"
        },
        overview: {
          about: "About the team",
          noDesc: "No description",
          teamId: "Team ID",
          stats: "Statistics",
          membersCount: "Members",
          compsCount: "Competitions"
        },
        members: {
          title: "Team Members",
          desc: "List of users who are part of this team.",
          userPrefix: "User #",
          noMembers: "No members.",
          inviteTitle: "Invite Members",
          inviteDesc: "Search users or invite by email.",
          searchUser: "Search user",
          inviteEmail: "Invite by Email",
          requestsTitle: "Access Requests",
          requestsDesc: "Users who want to join.",
          noRequests: "No pending requests."
        },
        competitions: {
          registerTitle: "Register for Competition",
          selectLabel: "Select Competition",
          selectPlaceholder: "-- Select --",
          activeTitle: "Active Registrations",
          noRegistrations: "No registrations found.",
          compPrefix: "Competition #",
          reason: "Reason:",
          centerReason: "Center:",
          status: {
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected"
          }
        },
        settings: {
          editTitle: "Edit Information",
          editDesc: "Update your team's public data.",
          streamTitle: "Streaming Configuration",
          streamDesc: "Manage your team's live broadcast.",
          streamStatus: "Broadcast Status",
          streamStatusDesc: "Start the broadcast to appear live.",
          dangerZone: "Danger Zone",
          deleteWarning: "Deleting the team will erase all data, members, and associated registrations. This action cannot be undone."
        },
        feedback: {
          created: "Team created successfully",
          createError: "Error creating team",
          saved: "Changes saved",
          saveError: "Could not save",
          invited: "Invitation sent to {{username}}",
          inviteError: "Could not invite",
          emailInvited: "Invitation sent by email",
          approved: "Request approved",
          approveError: "Could not approve",
          confirmRemoveMember: "Remove this member?",
          memberRemoved: "Member removed",
          removeMemberError: "Could not remove member",
          confirmLeave: "Are you sure you want to leave the team?",
          left: "You have left the team",
          leaveError: "Could not leave the team",
          confirmDelete: "ARE YOU SURE? This action cannot be undone.",
          deleted: "Team deleted",
          deleteError: "Could not delete",
          registrationSent: "Registration request sent",
          registrationError: "Could not send request",
          streamUrlMissing: "You must save a stream URL first",
          streamStarted: "Broadcast started!",
          streamError: "Error starting stream"
        }
      },
      team: {
        chat: {
          tab: 'Chat',
          title: 'Team Chat'
        }
      }
    }
  },
  de: {
    translation: {
      brand: 'RobEurope',
      languages: { es: 'ES', en: 'EN', de: 'DE' },
      nav: {
        home: 'Start',
        competitions: 'Wettkämpfe',
        teams: 'Teams',
        sponsors: 'Sponsoren',
        streams: 'Streaming',
        contact: 'Kontakt',
        terms: 'Bedingungen',
        profile: 'Profil',
        menu: 'Menü',
        userMenu: 'Benutzermenü',
        primaryNavigation: 'Hauptnavigation',
        myTeam: 'Mein Team',
        theme: 'Thema',
        posts: 'Nachrichten',
        gallery: 'Galerie',
        archives: 'Archiv',
        educationalCenters: 'Bildungseinrichtungen',
        feedback: 'Feedback',
        login: 'Anmelden',
        register: 'Registrieren',
        logout: 'Abmelden',
        adminSection: 'Verwaltung',
        manageCenters: 'Zentren verwalten',
        manageArchives: 'Archiv verwalten',
        managePosts: 'Beiträge verwalten',
        adminRequests: 'Admin-Anfragen'
      },
      status: {
        connected: 'Verbunden',
        checkingSession: 'Sitzung wird geprüft...'
      },
      buttons: {
        login: 'Login',
        register: 'Registrieren',
        logout: 'Abmelden',
        save: 'Speichern',
        saveChanges: 'Änderungen speichern',
        submitDemo: 'Demo senden',
        send: 'Senden',
        sending: 'Wird gesendet…',
        createAccount: 'Konto erstellen',
        alreadyAccount: 'Hast du schon ein Konto?',
        noAccount: 'Noch kein Konto?',
        goToLogin: 'Anmelden',
        goToRegister: 'Hier registrieren',
        calendar: 'Kalender',
        docs: 'API-Dokumentation',
        changePhoto: 'Aktualisieren',
        uploading: 'Wird hochgeladen…',
        saving: 'Wird gespeichert…',
        creating: 'Wird erstellt…',
        entering: 'Anmeldung…',
        apply: 'Anwenden'
      },
      footer: {
        description:
          'RobEurope bietet die beste Erfahrung in der Robotik. Wir arbeiten mit echten Fachleuten —den Besten auf ihrem Gebiet— um Innovation und Exzellenz in jedes Projekt zu bringen.',
        projects: 'PROJEKTE',
        competitions: 'Wettkämpfe',
        teams: 'Teams',
        streaming: 'Streaming',
        resources: 'RESSOURCEN',
        gallery: 'Galerie',
        sponsors: 'Sponsoren',
        feedback: 'Feedback',
        company: 'UNTERNEHMEN',
        about: 'Über uns',
        contact: 'Kontakt',
        terms: 'Bedingungen',
        social: {
          twitter: 'Twitter',
          github: 'GitHub',
          linkedin: 'LinkedIn',
          facebook: 'Facebook',
          instagram: 'Instagram',
          youtube: 'YouTube'
        },
        copyright: 'Alle Rechte vorbehalten.'
      },
      gallery: {
        galleryTitle: "Galerie",
        galleryDescription: "Eine Sammlung unserer Roboterveranstaltungsmomente",
        adminUploadTitle: 'Foto in die Galerie hochladen',
        uploadImage: 'Bild',
        uploadTitle: 'Titel (optional)',
        uploadDescription: 'Beschreibung (optional)',
        uploadCta: 'Hochladen',
        uploading: 'Lade hoch...',
        uploadMissingFile: 'Wähle ein Bild aus',
        uploadOk: 'Foto hochgeladen',
        loading: 'Laden...',
        delete: 'Löschen',
        deleting: 'Wird gelöscht...',
        seeMore: 'Mehr anzeigen',
        seeLess: 'Weniger anzeigen'
      },
      archives: {
        title: 'Informationsarchiv',
        description: 'Dokumente, Dateien und Informationstexte nach Wettbewerb',
        titleRequired: 'Titel ist erforderlich',
        empty: 'Keine Dateien gefunden',
        fields: {
          title: 'Titel',
          description: 'Beschreibung',
          content: 'Inhalt',
          file: 'Angehängte Datei',
          competition: 'Wettbewerb',
          visibility: 'Sichtbarkeit',
          allowedEmails: 'Erlaubte E-Mails',
          sortOrder: 'Sortierreihenfolge'
        },
        visibility: {
          hidden: 'Versteckt',
          public: 'Öffentlich',
          restricted: 'Eingeschränkt'
        },
        contentType: {
          label: 'Inhaltstyp',
          file: 'Datei',
          text: 'Text',
          mixed: 'Gemischt'
        },
        actions: {
          create: 'Element erstellen',
          edit: 'Element bearbeiten',
          delete: 'Element löschen',
          download: 'Datei herunterladen'
        },
        messages: {
          created: 'Element erfolgreich erstellt',
          updated: 'Element aktualisiert',
          deleted: 'Element gelöscht'
        },
        filters: {
          competitionAll: 'Alle Wettbewerbe',
          visibilityAll: 'Alle Sichtbarkeiten'
        }
      },
      educationalCenters: {
        title: 'Bildungseinrichtungen',
        description: 'Teilnehmende Bildungseinrichtungen',
        fields: {
          name: 'Name der Einrichtung',
          country: 'Land',
          city: 'Stadt',
          address: 'Adresse',
          website: 'Webseite',
          phone: 'Telefon',
          email: 'Kontakt-E-Mail',
          logo: 'Logo',
          description: 'Beschreibung',
          admin: 'Einrichtungsadministrator'
        },
        status: {
          pending: 'Ausstehende Genehmigung',
          approved: 'Genehmigt',
          rejected: 'Abgelehnt'
        },
        actions: {
          create: 'Einrichtung registrieren',
          edit: 'Einrichtung bearbeiten',
          delete: 'Einrichtung löschen',
          approve: 'Einrichtung genehmigen',
          reject: 'Einrichtung ablehnen'
        },
        messages: {
          created: 'Bildungseinrichtung erfolgreich registriert',
          updated: 'Bildungseinrichtung aktualisiert',
          deleted: 'Bildungseinrichtung gelöscht',
          approved: 'Bildungseinrichtung genehmigt',
          rejected: 'Bildungseinrichtung abgelehnt'
        },
        filters: {
          countryAll: 'Alle Länder',
          statusAll: 'Alle Status'
        }
      },
      centerApproval: {
        title: 'Zentrumsgenehmigung',
        reason: {
          placeholder: 'Geben Sie den Grund für die Entscheidung ein...'
        }
      },
      feedback: {
        Title: "Feedback",
        Description: "Meinungen unserer Nutzer",
        roleSamuel: "Frontend Lead @ Google",
        reviewSamuel: "Dieser Roboter-Event-Organisator hebt jeden Workshop wirklich auf ein neues Level. Die Sitzungen sind gut strukturiert, interaktiv und unglaublich inspirierend. Es ist der ideale Ort, um Robotik zu erkunden und praktische Erfahrungen zu sammeln.",
        roleAngel: "Frontend Lead @ Google",
        reviewAngel: "Ich habe eine Lösung für all meine Designbedürfnisse von Creative Tim gefunden. Ich nutze sie als Freelancer in meinen Hobbyprojekten zum Spaß! Und es ist wirklich erschwinglich, sehr bescheidene Leute!"
      },
      forms: {
        firstName: 'Vorname',
        lastName: 'Nachname',
        username: 'Benutzername',
        phone: 'Telefon',
        email: 'E-Mail',
        password: 'Passwort',
        newPassword: 'Neues Passwort',
        new_password: 'Neues Passwort',
        confirm_password: 'Passwort bestätigen',
        code: 'Code',
        organization: 'Organisation',
        message: 'Nachricht',
        country: 'Land',
        name: 'Name',
        acceptTerms: 'Sie müssen die Geschäftsbedingungen akzeptieren',
        passwordsDontMatch: 'Passwörter stimmen nicht überein',
        passwordTooWeak: 'Passwort ist zu schwach',
        passwordStrength: 'Stärke',
        repeatPassword: 'Passwort wiederholen'
      },
      placeholders: {
        emailExample: 'name@beispiel.de',
        phoneExample: '+49 170 1234567',
        nameExample: 'Max',
        lastNameExample: 'Mustermann',
        usernameExample: 'maxmuster',
        passwordExample: '••••••••'
      },
      common: {
        save: 'Speichern',
        saving: 'Speichert...',
        delete: 'Löschen',
        cancel: 'Abbrechen',
        edit: 'Bearbeiten',
        close: 'Schließen',
        loading: 'Lädt...',
        skipToContent: 'Zum Inhalt springen',
        adminModeActive: 'Admin-Modus aktiv',
        showPassword: 'Passwort anzeigen',
        hidePassword: 'Passwort verbergen',
        create: 'Erstellen',
        approve: 'Genehmigen',
        reject: 'Ablehnen'
      },
      status: {
        label: 'Status'
      },
      admin: {
        centers: {
          title: 'Bildungseinrichtungen verwalten',
          description: 'Registrierte Bildungseinrichtungen verwalten',
          create: 'Zentrum erstellen',
          edit: 'Zentrum bearbeiten',
          search: 'Zentren suchen...',
          empty: 'Keine Zentren gefunden',
          approved: 'Zentrum genehmigt',
          rejected: 'Zentrum abgelehnt',
          deleted: 'Zentrum gelöscht',
          updated: 'Zentrum aktualisiert',
          created: 'Zentrum erstellt',
          confirmDelete: 'Dieses Zentrum löschen?',
          rejectReason: 'Ablehnungsgrund:',
          status: {
            pending: 'Ausstehend',
            approved: 'Genehmigt',
            rejected: 'Abgelehnt'
          },
          filter: {
            all: 'Alle',
            pending: 'Ausstehend',
            approved: 'Genehmigt',
            rejected: 'Abgelehnt'
          },
          form: {
            name: 'Name',
            city: 'Stadt',
            email: 'E-Mail',
            website: 'Webseite',
            description: 'Beschreibung'
          },
          centerRegistrationsTitle: 'Wettbewerbsanfragen des Zentrums',
          centerRegistrationsDesc: 'Anfragen von Teams deines Zentrums genehmigen oder ablehnen.',
          noRegistrations: 'Keine ausstehenden Anfragen.',
          competitionLabel: 'Wettbewerb',
          centerStudentsTitle: 'Schüler des Zentrums',
          centerStudentsDesc: 'Benutzer, die deinem Bildungszentrum zugeordnet sind.',
          noStudents: 'Keine zugeordneten Schüler.',
          centerTeamsTitle: 'Teams des Zentrums',
          centerTeamsDesc: 'Teams, die deinem Bildungszentrum zugeordnet sind.',
          noTeams: 'Keine zugeordneten Teams.',
          confirmRemoveUser: 'Diesen Schüler aus dem Zentrum entfernen?',
          confirmRemoveTeam: 'Dieses Team aus dem Zentrum entfernen?',
          centerApprovedReason: 'Vom Zentrum genehmigt',
          centerRejectReason: 'Ablehnungsgrund:'
        },
        archives: {
          title: 'Archiv verwalten',
          description: 'Archivdateien des Zentrums verwalten',
          upload: 'Datei hochladen',
          edit: 'Datei bearbeiten',
          search: 'Dateien suchen...',
          empty: 'Keine Dateien gefunden',
          deleted: 'Datei gelöscht',
          updated: 'Datei aktualisiert',
          created: 'Datei erstellt',
          confirmDelete: 'Diese Datei löschen?',
          types: {
            document: 'Dokument',
            image: 'Bild',
            video: 'Video',
            other: 'Sonstiges'
          },
          visibility: {
            public: 'Öffentlich',
            restricted: 'Eingeschränkt',
            hidden: 'Versteckt'
          },
          form: {
            title: 'Titel',
            type: 'Typ',
            competition: 'Wettbewerb',
            noCompetition: '-- Kein Wettbewerb --',
            year: 'Jahr',
            visibility: 'Sichtbarkeit',
            file: 'Datei',
            description: 'Beschreibung',
            allowedEmails: 'Erlaubte E-Mails',
            emailsPlaceholder: 'email1@beispiel.de, email2@beispiel.de',
            emailsHelp: 'E-Mails mit Kommas trennen. Nur diese Benutzer können die Datei sehen.'
          }
        },
        requests: {
          title: 'Zentrum-Admin-Anfragen',
          description: 'Anfragen von Benutzern zur Zentrumsadministration verwalten',
          empty: 'Keine Anfragen gefunden',
          approved: 'Anfrage genehmigt',
          rejected: 'Anfrage abgelehnt',
          rejectReason: 'Ablehnungsgrund:',
          reason: 'Grund',
          requestedAt: 'Angefordert',
          status: {
            pending: 'Ausstehend',
            approved: 'Genehmigt',
            rejected: 'Abgelehnt'
          },
          filter: {
            pending: 'Ausstehend',
            approved: 'Genehmigt',
            rejected: 'Abgelehnt'
          },
          type: {
            create: 'Zentrum erstellen',
            join: 'Zentrum beitreten'
          }
        },
        posts: {
          title: 'Beitragsverwaltung',
          description: 'Erstellen, bearbeiten und löschen Sie Systembeiträge.',
          create: 'Neuer Beitrag',
          edit: 'Beitrag bearbeiten',
          searchPlaceholder: 'Beiträge suchen...',
          titleLabel: 'Titel',
          contentLabel: 'Inhalt',
          pinPost: 'Beitrag anheften',
          tableTitle: 'Titel',
          tableAuthor: 'Autor',
          tableStatus: 'Status',
          tableActions: 'Aktionen',
          noPosts: 'Keine Beiträge vorhanden.',
          confirmDelete: 'Diesen Beitrag löschen?',
          pinned: 'Angeheftet'
        }
      },
      actions: {
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        create: 'Erstellen',
        confirmDelete: 'Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?'
      },
      charts: {
        empty: 'Keine Daten verfügbar'
      },
      theme: {
        toggle: 'Theme wechseln',
        light: 'Hell',
        dark: 'Dunkel',
        system: 'System'
      },
      auth: {
        orContinueWith: 'Oder weiter mit',
        orSignUpWith: 'Oder registrieren mit',
        signInWithLdap: 'Mit LDAP anmelden',
        backToLogin: 'Zurück zur Anmeldung'
      },
      forgot: {
        tagline: 'WIEDERHERSTELLEN',
        title: 'Passwort wiederherstellen',
        description: 'Wir senden Ihnen einen Einmalcode zum Zurücksetzen.',
        description2: 'Geben Sie den Code und Ihr neues Passwort ein.',
        sent: 'Wir haben Ihnen einen Einmalcode gesendet, falls die E-Mail existiert.',
        error: 'Fehler beim Anfordern der Wiederherstellung',
        reset_success: 'Passwort erfolgreich aktualisiert.',
        reset_error: 'Ungültiger oder abgelaufener Code'
      },
      notFound: {
        subtitle: 'Bist du verloren?',
        message: 'Die Seite, die Sie suchen, existiert nicht. Vielleicht haben Sie die Adresse falsch eingegeben oder die Seite wurde verschoben.',
        backHome: 'Zurück zur Startseite',
        badge: 'Seite nicht gefunden',
        title: 'Ups…',
        description: 'Die gesuchte Seite existiert nicht (mehr) oder wurde verschoben. Du kannst zurückgehen oder zur Startseite.',
        goBack: 'Zurück',
        goHome: 'Zur Startseite',
        robotHint: 'Mein Radar findet diese Seite nicht.'
      },
      sponsors: {
        title: 'Sponsoren',
        subtitle: 'Verwalte die Sponsoren des Events',
        create: 'Neuer Sponsor',
        edit: 'Sponsor bearbeiten',
        createDesc: 'Füge einen neuen Sponsor zum Event hinzu',
        editDesc: 'Passe die Sponsor-Daten an',
        form: {
          name: 'Name',
          logo: 'Logo-URL',
          website: 'Webseite'
        },
        empty: 'Keine Sponsoren vorhanden',
        emptyDesc: 'Füge deinen ersten Sponsor hinzu',
        created: 'Erstellt',
        logo: 'Logo',
        website: 'Webseite',
        id: 'ID'
      },
      posts: {
        title: 'Nachrichten',
        subtitle: 'Bleiben Sie auf dem Laufenden mit den neuesten Updates',
        search: 'Nachrichten suchen...',
        create: 'Beitrag erstellen',
        createTitle: 'Neuen Beitrag erstellen',
        form: {
          title: 'Titel',
          content: 'Inhalt',
          image: 'Bild'
        },
        empty: 'Noch keine Nachrichten.',
        created: 'Beitrag erfolgreich erstellt',
        error: 'Fehler bei der Verarbeitung der Anfrage',
        confirmDelete: 'Sind Sie sicher, dass Sie diesen Beitrag löschen möchten?',
        deleted: 'Beitrag gelöscht',
        pinned: 'Angeheftet',
        unpinned: 'Nicht mehr angeheftet',
        comments: 'Kommentare',
        noComments: 'Noch keine Kommentare.',
        writeComment: 'Schreibe einen Kommentar...'
      },
      teams: {
        title: 'Teams',
        subtitle: 'Entdecke und trete den besten Robotik-Teams bei',
        create: 'Team erstellen',
        createTitle: 'Neues Team erstellen',
        form: {
          name: 'Teamname',
          description: 'Beschreibung',
          website: 'Webseite',
          country: 'Land'
        },
        searchPlaceholder: 'Teams suchen...',
        searchButton: 'Suchen',
        allCountries: 'Alle Länder',
        members: 'Mitglieder',
        manage: 'Mein Team verwalten',
        requestJoin: 'Beitritt anfragen',
        loginToJoin: 'Anmelden zum Beitreten',
        noTeams: 'Keine Teams gefunden.',
        feedback: {
          created: 'Team erfolgreich erstellt',
          createError: 'Team konnte nicht erstellt werden',
          requestSent: 'Anfrage gesendet',
          requestError: 'Anfrage konnte nicht gesendet werden'
        }
      },
      home: {
        hero: {
          tagline: 'Europäische Bildungsrobotik',
          title: 'RobEurope 2025 · die kontinentale Bildungsrobotik-Liga',
          description:
            'Offizielle Streams, Echtzeitdaten und offene APIs, damit jede Schule ihren Roboter entwerfen, simulieren und ausrollen kann.',
          primaryCta: 'Kalender',
          secondaryCta: 'API-Dokumentation'
        },
        callouts: {
          nextQualifier: { label: 'Nächste Qualifikation', fallback: 'Noch offen' },
          streaming: { label: 'Livestream', fallback: 'Offline' },
          teams: { label: 'Registrierte Teams', detail: 'Saison 2025' }
        },
        locked:
          'Melde dich an, um den echten Wettbewerbskalender und die Teamstatistiken zu sehen. Diese Bereiche nutzen dieselben geschützten Endpunkte wie das Backend.',
        pillars: {
          stem: {
            title: 'Angewandtes MINT',
            body: 'Reale Aufgaben in Mechatronik, KI und Computer Vision.'
          },
          europe: {
            title: 'Vernetztes Europa',
            body: 'Schulen aus vielen Ländern treten in derselben Liga an.'
          },
          impact: {
            title: 'Sozialer Impact',
            body: 'Öffentliche Programme, Stipendien und Beteiligung von Mädchen.'
          }
        },
        pillarLabel: 'Säule',
        loading: 'Synchronisiere mit der API...',
        error: 'Informationen konnten nicht geladen werden.',
        howItWorks: {
          title: "Wie es funktioniert",
          description: "Die Teilnahme an RobEurope ist ganz einfach. Folgen Sie diesen Schritten, um Ihre Reise im Wettbewerb zu beginnen.",
          steps: {
            register: {
              title: "Registrieren",
              description: "Erstellen Sie Ihr RobEurope-Konto, um auf alle Funktionen zuzugreifen."
            },
            team: {
              title: "Team bilden",
              description: "Treten Sie einem bestehenden Team bei oder gründen Sie ein neues mit Ihren Teamkollegen."
            },
            enroll: {
              title: "Anmelden",
              description: "Finden Sie aktive Wettbewerbe und melden Sie Ihr Team zur Teilnahme an."
            },
            compete: {
              title: "Wettbewerb und Gewinn",
              description: "Zeigen Sie Ihre Fähigkeiten, steigen Sie im Ranking auf und gewinnen Sie Preise."
            }
          }
        },
        stats: {
          teams: "Aktive Teams",
          competitions: "Jährliche Wettbewerbe",
          viewers: "Zuschauer",
          countries: "Länder"
        },
        latest: {
          title: "Neueste Nachrichten",
          description: "Bleiben Sie auf dem Laufenden mit den neuesten Nachrichten und Ligawettbewerben.",
          news: "Nachrichten",
          viewAll: "Alle anzeigen",
          competitions: "Wettbewerbe",
          viewCalendar: "Kalender anzeigen"
        },
        cta: {
          title: "Bereit zum Wettbewerb?",
          description: "Treten Sie der größten Robotik-Community in Europa bei und zeigen Sie Ihre Fähigkeiten.",
          button: "Jetzt registrieren"
        }
      },
      competitions: {
        hero: {
          tagline: 'Offizieller Circuit',
          title: 'RobEurope-Wettkämpfe',
          description:
            'Über die API erhältst du Termine, Hosts und das technische Regelwerk. Diese Ansicht nutzt dieselben abgesicherten Endpunkte wie das Backend.'
        },
        locked: 'Melde dich an, um /api/competitions aufzurufen und den echten Kalender zu sehen.',
        loading: 'Kalender wird synchronisiert...',
        error: 'Wettkämpfe konnten nicht synchronisiert werden.',
        empty: 'Es wurden noch keine Wettkämpfe angelegt.',
        featured: 'Empfohlener Stream',
        timelineLabel: 'Timeline',
        timelineTitle: 'Bestätigte Meilensteine',
        inquiry:
          'Du möchtest einen RobEurope-Stopp in deinem Land ausrichten? <ContactLink>Schreib uns über die Kontaktsektion</ContactLink> oder an <MailLink>partnerships@robeurope.eu</MailLink>. Updates findest du außerdem in <TermsLink>unserem Bedingungen-Portal</TermsLink>.',
        card: {
          descriptionFallback: 'Offizielle RobEurope-Prüfung',
          start: 'Start',
          status: 'Status',
          venue: 'Austragungsort',
          teams: 'Teams',
          tbd: 'Noch offen',
          venueFallback: 'Multi-Standort'
        },
        noDescription: 'Keine Beschreibung verfügbar.',
        viewDetails: 'Details anzeigen',
        create: 'Wettbewerb erstellen',
        createTitle: 'Neuer Wettbewerb',
        form: {
          title: 'Titel',
          description: 'Beschreibung',
          location: 'Ort',
          startDate: 'Startdatum',
          endDate: 'Enddatum',
          maxTeams: 'Max. Teams',
          isActive: 'Als aktiven Wettbewerb markieren (deaktiviert andere)'
        },
        activeBadge: 'Aktiv',
        restrictedBadge: 'Eingeschränkter Zugang',
        restrictedMessage: 'Sie müssen ein genehmigter Teilnehmer an diesem Wettbewerb sein, um Streams und weitere Details zu sehen.',
        streamRestricted: 'Eingeschränkter Zugang (Registrieren zum Ansehen)',
        noStreams: 'Keine aktiven Streams für diesen Wettbewerb.',
        loadError: 'Fehler beim Laden der Wettbewerbe.',
        createError: 'Fehler beim Erstellen des Wettbewerbs',
        noActive: 'Derzeit keine aktiven Wettbewerbe.',
        searchPlace: 'Name, Stadt...',
        onlyActive: 'Nur aktive',
        onlyFavorites: 'Nur Favoriten',
        // Action labels
        active: 'Aktiv',
        setActive: 'Als aktiv markieren',
        setActiveError: 'Konnte nicht als aktiv markieren',
        removeFavorite: 'Aus Favoriten entfernen',
        addFavorite: 'Zu Favoriten hinzufügen',
        deactivate: 'Deaktivieren',
        // Detail page
        detail: {
          back: 'Zurück',
          share: 'Teilen',
          linkCopied: 'Link kopiert',
          linkCopiedDesc: 'Der Link zur Veranstaltung wurde in die Zwischenablage kopiert.',
          loading: 'Laden...',
          notFound: 'Wettbewerb nicht gefunden',
          aboutEvent: 'Über das Event',
          liveStreams: 'Live-Streams',
          watchOnPlatform: 'Auf Plattform ansehen',
          participatingTeams: 'Teilnehmende Teams',
          noTeamsYet: 'Noch keine Teams registriert.',
          noLocation: 'Kein Standort',
          publicFiles: 'Öffentliche Dateien',
          information: 'Information',
          organizer: 'Veranstalter',
          website: 'Website',
          teamsCount: 'Teams'
        }
      },
      streams: {
        title: 'Streams',
        subtitle: 'Sieh dir alle Streams der Wettbewerbe an',
        loading: 'Streams werden geladen...',
        error: 'Fehler:',
        noStreams: 'Keine Streams verfügbar.',
        noCenter: 'Kein Bildungszentrum',
        created: 'Erstellt',
        status: {
          live: 'Live',
          offline: 'Offline',
          scheduled: 'Geplant'
        },
        team: 'Team',
        competition: 'Wettbewerb',
        watch: 'Stream ansehen'
      },
      contact: {
        hero: {
          tagline: 'Kontakt',
          title: 'Lass uns über RobEurope sprechen',
          description:
            'Wir betreuen Fragen zu Lizenzen, Sponsoring, Ehrenamt und Workshops. Für Produktionszugänge zur API genügt das Formular, danach senden wir dir dedizierte Schlüssel.'
        },
        channels: [
          { title: 'Mentoren & Coaches', detail: 'mentors@robeurope.eu', note: 'Register offizieller Trainer' },
          { title: 'Sponsoren & Presse', detail: 'press@robeurope.eu', note: 'Mediakit & Unterlagen' },
          { title: 'Technischer Support', detail: '+34 900 123 456', note: 'Digitale Infrastruktur & APIs' }
        ],
        form: {
          title: 'Plane deinen Call',
          description: 'Dies sendet keine echten Daten; es ist ein Mockup zur Illustration der Backend-Flows.',
          success: 'Danke! Wir melden uns in Kürze.',
          submit: 'Demo senden'
        },
        contactUs: "Kontaktieren Sie uns",
        contactUsDesc: "Wir sind hier, um zu helfen. Füllen Sie das Formular aus und wir werden uns so schnell wie möglich bei Ihnen melden.",
        sentTitle: "Nachricht gesendet!",
        sentDesc: "Danke für Ihre Nachricht. Wir werden uns in Kürze melden.",
        sendAnother: "Eine weitere Nachricht senden",
        support: "24/7 Support für Teams",
        placeholders: {
          name: "Dein Name",
          email: "du@email.com"
        }
      },
      profile: {
        heroTagline: 'Verknüpftes Konto',
        heroNote: 'Änderungen synchronisieren mit /users/me.',
        educationalCenter: 'Bildungszentrum',
        noEducationalCenter: 'Kein Zentrum zugewiesen',
        centerAdminBadge: 'Administrator',
        studentBadge: 'Schüler',
        centersLoadError: 'Zentren konnten nicht geladen werden.',
        feedback: {
          success: 'Profil erfolgreich aktualisiert.',
          error: 'Profil konnte nicht aktualisiert werden.',
          photoSuccess: 'Foto erfolgreich aktualisiert.',
          photoError: 'Upload des Fotos fehlgeschlagen.'
        },
        countriesError: 'Länder konnten nicht geladen werden. Prüfe die API-Verbindung.'
      },
      login: {
        tagline: 'RobEurope-Portal',
        title: 'Anmelden',
        description: 'Nutze die Zugangsdaten aus dem Backend (/auth/login), um dein JWT zu erhalten.',
        noAccount: 'Noch kein Konto?',
        registerLink: 'Hier registrieren',
        forgot: 'Passwort vergessen?',
        error: 'Ungültige Zugangsdaten'
      },
      register: {
        tagline: 'Programm für neue Teams',
        title: 'Erstelle dein Konto',
        description: 'Die Daten werden an /auth/register gesendet, um ein Token zu erstellen und dich zu speichern.',
        hasAccount: 'Hast du schon ein Konto?',
        loginLink: 'Anmelden',
        acceptTerms: 'Ich akzeptiere die',
        studentCenterLabel: 'Bildungszentrum (optional)',
        studentCenterPlaceholder: '-- Kein Zentrum ausgewählt --',
        studentCenterHelp: 'Optional. Du kannst es später in deinem Profil ändern.',
        wantsCenterAdmin: 'Möchtest du ein Bildungszentrum verwalten?',
        centerAdminDescription: 'Als Zentrumsadministrator kannst du Teams, Streams und Dateien deiner Einrichtung verwalten.',
        selectExistingCenter: 'Bestehendes Zentrum auswählen',
        noCenter: '-- Zentrum auswählen --',
        orCreateCenter: 'Zentrum nicht gefunden? Hier erstellen',
        createNewCenter: 'Neues Bildungszentrum erstellen',
        centerName: 'Name des Zentrums',
        centerNamePlaceholder: 'Gymnasium / Hochschule / Universität...',
        centerCity: 'Stadt',
        centerCityPlaceholder: 'Berlin, München...',
        centerEmail: 'Kontakt-E-Mail',
        centerWebsite: 'Webseite',
        centerPendingApproval: 'Das Zentrum muss von einem Super-Administrator genehmigt werden.',
        centerNameRequired: 'Der Name des Zentrums ist erforderlich'
      },
      general: {
        countriesLoading: 'Länder werden geladen…',
        search: 'Suchen'
      },
      myTeam: {
        title: "Mein Team",
        createTitle: "Team erstellen",
        createDesc: "Du gehörst keinem Team an. Erstelle ein neues, um zu beginnen.",
        form: {
          name: "Teamname",
          city: "Stadt",
          country: "Land (ID)",
          institution: "Institution / Zentrum",
          description: "Beschreibung",
          website: "Webseite",
          streamUrl: "Stream-URL (Twitch/YouTube)",
          submitCreate: "Team erstellen",
          submitSave: "Änderungen speichern",
          saveUrl: "URL speichern",
          centerDescription: "Verbinde dein Team mit einer bestehenden Bildungseinrichtung oder erstelle eine neue.",
          selectCenter: "Bildungseinrichtung auswählen",
          noCenter: "-- Keine Bildungseinrichtung --",
          orCreateCenter: "Findest du deine Einrichtung nicht?",
          createNewCenter: "Neue Einrichtung erstellen",
          onlyAdminsCanCreate: "Nur Zentrumsadministratoren können neue Bildungseinrichtungen erstellen."
        },
        tabs: {
          overview: "Übersicht",
          members: "Mitglieder",
          competitions: "Wettbewerbe",
          settings: "Einstellungen"
        },
        roles: {
          owner: "Eigentümer",
          member: "Mitglied"
        },
        actions: {
          leave: "Team verlassen",
          delete: "Team löschen",
          removeMember: "Entfernen",
          invite: "Einladen",
          approve: "Genehmigen",
          startStream: "LIVE starten",
          register: "Anmeldung anfordern"
        },
        overview: {
          about: "Über das Team",
          noDesc: "Keine Beschreibung",
          teamId: "Team-ID",
          stats: "Statistiken",
          membersCount: "Mitglieder",
          compsCount: "Wettbewerbe"
        },
        members: {
          title: "Teammitglieder",
          desc: "Liste der Benutzer, die Teil dieses Teams sind.",
          userPrefix: "Benutzer #",
          noMembers: "Keine Mitglieder.",
          inviteTitle: "Mitglieder einladen",
          inviteDesc: "Benutzer suchen oder per E-Mail einladen.",
          searchUser: "Benutzer suchen",
          inviteEmail: "Per E-Mail einladen",
          requestsTitle: "Zugangsanfragen",
          requestsDesc: "Benutzer, die beitreten möchten.",
          noRequests: "Keine ausstehenden Anfragen."
        },
        competitions: {
          registerTitle: "Für Wettbewerb anmelden",
          selectLabel: "Wettbewerb auswählen",
          selectPlaceholder: "-- Auswählen --",
          activeTitle: "Aktive Anmeldungen",
          noRegistrations: "Keine Anmeldungen gefunden.",
          compPrefix: "Wettbewerb #",
          reason: "Grund:",
          centerReason: "Zentrum:",
          status: {
            pending: "Ausstehend",
            approved: "Genehmigt",
            rejected: "Abgelehnt"
          }
        },
        settings: {
          editTitle: "Informationen bearbeiten",
          editDesc: "Aktualisiere die öffentlichen Daten deines Teams.",
          streamTitle: "Streaming-Konfiguration",
          streamDesc: "Verwalte die Live-Übertragung deines Teams.",
          streamStatus: "Sendestatus",
          streamStatusDesc: "Starte die Übertragung, um live zu erscheinen.",
          dangerZone: "Gefahrenzone",
          deleteWarning: "Das Löschen des Teams löscht alle Daten, Mitglieder und zugehörigen Anmeldungen. Diese Aktion kann nicht rückgängig gemacht werden."
        },
        feedback: {
          created: "Team erfolgreich erstellt",
          createError: "Fehler beim Erstellen des Teams",
          saved: "Änderungen gespeichert",
          saveError: "Konnte nicht speichern",
          invited: "Einladung an {{username}} gesendet",
          inviteError: "Konnte nicht einladen",
          emailInvited: "Einladung per E-Mail gesendet",
          approved: "Anfrage genehmigt",
          approveError: "Konnte nicht genehmigen",
          confirmRemoveMember: "Dieses Mitglied entfernen?",
          memberRemoved: "Mitglied entfernt",
          removeMemberError: "Konnte Mitglied nicht entfernen",
          confirmLeave: "Bist du sicher, dass du das Team verlassen möchtest?",
          left: "Du hast das Team verlassen",
          leaveError: "Konnte das Team nicht verlassen",
          confirmDelete: "BIST DU SICHER? Diese Aktion kann nicht rückgängig gemacht werden.",
          deleted: "Team gelöscht",
          deleteError: "Konnte nicht löschen",
          registrationSent: "Anmeldeanfrage gesendet",
          registrationError: "Konnte Anfrage nicht senden",
          streamUrlMissing: "Du musst zuerst eine Stream-URL speichern",
          streamStarted: "Übertragung gestartet!",
          streamError: "Fehler beim Starten des Streams"
        }
      },
      team: {
        chat: {
          tab: 'Chat',
          title: 'Team-Chat'
        }
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false
  }
});

applyDocumentLanguage(i18n.language);

i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.warn('No se pudo guardar el idioma seleccionado', error);
  }
});

export default i18n;
