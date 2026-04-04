// Carga el .env de la raíz del proyecto independientemente
// del directorio desde el que se arranque el proceso.
import fs from 'fs';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendEnvPath = resolve(__dirname, '.env');
const rootEnvPath = resolve(__dirname, '../.env');

// Prefer backend/.env (deployment/local backend), then fill missing values from root .env
if (fs.existsSync(backendEnvPath)) {
	dotenv.config({ path: backendEnvPath });
	dotenv.config({ path: rootEnvPath, override: false });
} else {
	dotenv.config({ path: rootEnvPath });
}
