import path from 'path';
import { fileURLToPath } from 'url';
import i18n from 'i18n';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const supportedLocales = ['es', 'en', 'de'];

i18n.configure({
  locales: supportedLocales,
  defaultLocale: 'es',
  directory: path.join(__dirname, '..', 'locales'),
  objectNotation: true,
  autoReload: process.env.NODE_ENV !== 'production',
  updateFiles: false,
  syncFiles: false,
  cookie: 'locale',
  api: {
    __: '__',
    __n: '__n'
  },
  register: globalThis
});

export default i18n;
