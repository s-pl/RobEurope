import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from '../utils/logger.js';
import dbConfig from "../config/db.config.js";
dotenv.config();

/**
 * @fileoverview
 * Sequelize database connection factory.
 *
 * This project uses ESM modules and MySQL via `mysql2`.
 * Tables are configured with `freezeTableName: true` and `timestamps: false` because
 * models explicitly define `created_at`/`updated_at` fields.
 */

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer explicit envs following the tutorial, with sane fallbacks for current vars
const DB_HOST = dbConfig.DB_HOST; // DB_URL was used as host before
const DB_PORT = parseInt(dbConfig.DB_PORT || "3306", 10);
const DB_NAME = dbConfig.DB_NAME // avoid hardcoding "mysql"
const DB_USER = dbConfig.DB_USER;
const DB_PASS = dbConfig.DB_PASS;
console.log(`Connecting to DB at ${DB_HOST}:${DB_PORT}, database: ${DB_NAME}, user: ${DB_USER}`);
// SSL CA certificate handling (DigitalOcean Managed DBs require TLS)
// Default to the cert shipped in backend/certs if no env override provided
const defaultCaPath = path.resolve(__dirname, "../certs/ca-certificate.crt");
const CA_PATH = process.env.DB_SSL_CA || defaultCaPath;

const isLocalHost = ["localhost", "127.0.0.1", "::1", "mysql"].includes(DB_HOST);

let dialectOptions = {};
if (isLocalHost) {
  // Local Docker MySQL — no SSL needed
  dialectOptions = { ssl: false };
} else {
  try {
    if (fs.existsSync(CA_PATH)) {
      dialectOptions = {
        ssl: {
          // Provide CA and enforce verification; mysql2 uses Node TLS options
          ca: fs.readFileSync(CA_PATH, "utf8"),
          rejectUnauthorized: true,
          minVersion: "TLSv1.2",
        },
      };
    }
  } catch (err) {
    console.warn(`Warning: Unable to read SSL CA file at ${CA_PATH}. Proceeding without explicit CA.`);
  }
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  dialectOptions,
  logging: false,
  define: {
    freezeTableName: true,
    // Do not let Sequelize automatically add `createdAt`/`updatedAt` camelCase columns
    // Models in this project define their own `created_at`/`updated_at` fields explicitly.
    timestamps: false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
// validate connection once on startup
sequelize
  .authenticate()
  .then(() => {
    logger.info('Sequelize: connection authenticated')
  })
  .catch((error) => {
    logger.error({ sequelize: true, event: 'authenticate', message: error.message, stack: error.stack, errors: error.errors });
  });

/**
 * Shared Sequelize instance used throughout the backend.
 * @type {Sequelize}
 */
export default sequelize;
