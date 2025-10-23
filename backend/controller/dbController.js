import { Sequelize } from "sequelize";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

config();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer explicit envs following the tutorial, with sane fallbacks for current vars
const DB_HOST = process.env.DB_HOST || process.env.DB_URL; // DB_URL was used as host before
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE; // avoid hardcoding "mysql"
const DB_USER = process.env.DB_USERNAME || process.env.DB_USER;
const DB_PASS = process.env.DB_PASSWORD;
console.log(`Connecting to DB at ${DB_HOST}:${DB_PORT}, database: ${DB_NAME}, user: ${DB_USER}`);
// SSL CA certificate handling (DigitalOcean Managed DBs require TLS)
// Default to the cert shipped in backend/certs if no env override provided
const defaultCaPath = path.resolve(__dirname, "../certs/ca-certificate.crt");
const CA_PATH = process.env.DB_SSL_CA || defaultCaPath;

let dialectOptions = {};
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
  // If SSL is required and cert is missing, Sequelize will fail on connect – that's desirable in prod
  // but we avoid throwing here to keep local dev flexible.
  console.warn(`Warning: Unable to read SSL CA file at ${CA_PATH}. Proceeding without explicit CA.`);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  dialectOptions,
  logging: false,
  define: {
   
    freezeTableName: true,
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
    console.log("Database connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

export default sequelize;
