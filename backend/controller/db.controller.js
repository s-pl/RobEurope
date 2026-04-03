import { Sequelize } from "sequelize";
import logger from '../utils/logger.js';
import dbConfig from "../config/db.config.js";

/**
 * @fileoverview
 * Sequelize database connection factory.
 *
 * Supports Supabase (PostgreSQL) via DATABASE_URL or individual env vars.
 * In production, DATABASE_URL takes precedence (Supabase connection string).
 */

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (process.env.DATABASE_URL) {
  // Supabase / any PostgreSQL provider via connection string
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: isProduction ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: false,
    },
    pool: {
      max: 5, // Supabase free tier: max 20 connections
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Fallback: individual env vars (local dev with PostgreSQL)
  const DB_HOST = dbConfig.DB_HOST;
  const DB_PORT = parseInt(dbConfig.DB_PORT || '5432', 10);
  const DB_NAME = dbConfig.DB_NAME;
  const DB_USER = dbConfig.DB_USER;
  const DB_PASS = dbConfig.DB_PASS;

  console.log(`Connecting to DB at ${DB_HOST}:${DB_PORT}, database: ${DB_NAME}, user: ${DB_USER}`);

  const isLocalHost = ['localhost', '127.0.0.1', '::1', 'postgres'].includes(DB_HOST);

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: isLocalHost ? false : { require: true, rejectUnauthorized: false },
    },
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

sequelize
  .authenticate()
  .then(() => logger.info('Sequelize: connection authenticated'))
  .catch((error) => {
    logger.error({ sequelize: true, event: 'authenticate', message: error.message, stack: error.stack });
  });

export default sequelize;
