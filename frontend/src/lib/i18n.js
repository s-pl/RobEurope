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
        profile: 'Perfil'
      },
      status: {
        connected: 'Conectado',
        checkingSession: 'Comprobando sesión...'
      },
      buttons: {
        login: 'Entrar',
        register: 'Registro',
        logout: 'Cerrar sesión',
        saveChanges: 'Guardar cambios',
        submitDemo: 'Enviar demo',
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
        entering: 'Entrando…'
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
        terms: 'Términos'
      },
      gallery: {
        galleryTitle: "Galería",
        galleryDescription: "Una colección de momentos de nuestro evento de robótica",
      },
      forms: {
        firstName: 'Nombre',
        lastName: 'Apellidos',
        username: 'Username',
        phone: 'Teléfono',
        email: 'Email',
        password: 'Contraseña',
        organization: 'Organización',
        message: 'Mensaje',
        country: 'País',
        name: 'Nombre'
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
        error: 'No se pudo cargar la información'
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
        }
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
        }
      },
      profile: {
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
        error: 'Credenciales inválidas'
      },
      register: {
        tagline: 'Programa nuevos equipos',
        title: 'Crea tu cuenta',
        description: 'Los datos se envían al endpoint /auth/register para emitir un token y almacenarte en la base de datos.',
        hasAccount: '¿Ya tienes cuenta?',
        loginLink: 'Inicia sesión'
      },
      general: {
        countriesLoading: 'Cargando países…'
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
        profile: 'Profile'
      },
      status: {
        connected: 'Online',
        checkingSession: 'Checking session...'
      },
      buttons: {
        login: 'Login',
        register: 'Register',
        logout: 'Log out',
        saveChanges: 'Save changes',
        submitDemo: 'Send demo',
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
        entering: 'Logging in…'
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
        terms: 'Terms'
      },
      gallery: {
        galleryTitle: "Gallery",
        galleryDescription: "A collection of our robotics event moments",
      },
      forms: {
        firstName: 'First name',
        lastName: 'Last name',
        username: 'Username',
        phone: 'Phone',
        email: 'Email',
        password: 'Password',
        organization: 'Organization',
        message: 'Message',
        country: 'Country',
        name: 'Name'
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
        error: 'We could not load the information.'
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
        }
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
        }
      },
      profile: {
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
        error: 'Invalid credentials'
      },
      register: {
        tagline: 'New teams program',
        title: 'Create your account',
        description: 'Data is sent to /auth/register to issue a token and store you in the database.',
        hasAccount: 'Already have an account?',
        loginLink: 'Sign in'
      },
      general: {
        countriesLoading: 'Loading countries…'
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
        profile: 'Profil'
      },
      status: {
        connected: 'Verbunden',
        checkingSession: 'Sitzung wird geprüft...'
      },
      buttons: {
        login: 'Login',
        register: 'Registrieren',
        logout: 'Abmelden',
        saveChanges: 'Änderungen speichern',
        submitDemo: 'Demo senden',
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
        entering: 'Anmeldung…'
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
        terms: 'Bedingungen'
      },
      gallery: {
        galleryTitle: "Galerie",
        galleryDescription: "Eine Sammlung unserer Roboterveranstaltungsmomente",
      },
      forms: {
        firstName: 'Vorname',
        lastName: 'Nachname',
        username: 'Benutzername',
        phone: 'Telefon',
        email: 'E-Mail',
        password: 'Passwort',
        organization: 'Organisation',
        message: 'Nachricht',
        country: 'Land',
        name: 'Name'
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
        error: 'Informationen konnten nicht geladen werden.'
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
        }
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
        }
      },
      profile: {
        heroTagline: 'Verknüpftes Konto',
        heroNote: 'Änderungen synchronisieren mit /users/me.',
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
        error: 'Ungültige Zugangsdaten'
      },
      register: {
        tagline: 'Programm für neue Teams',
        title: 'Erstelle dein Konto',
        description: 'Die Daten werden an /auth/register gesendet, um ein Token zu erstellen und dich zu speichern.',
        hasAccount: 'Hast du schon ein Konto?',
        loginLink: 'Anmelden'
      },
      general: {
        countriesLoading: 'Länder werden geladen…'
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

i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.warn('No se pudo guardar el idioma seleccionado', error);
  }
});

export default i18n;
