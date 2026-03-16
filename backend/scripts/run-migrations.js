import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const META_TABLE = 'SequelizeMeta';

function normalizeTableName(tableEntry) {
  if (typeof tableEntry === 'string') return tableEntry;
  if (!tableEntry || typeof tableEntry !== 'object') return '';
  if (tableEntry.tableName) return tableEntry.tableName;
  if (tableEntry.name) return tableEntry.name;
  const firstValue = Object.values(tableEntry)[0];
  return typeof firstValue === 'string' ? firstValue : '';
}

async function ensureMetaTable(queryInterface) {
  const tables = await queryInterface.showAllTables();
  const tableNames = (tables || []).map(normalizeTableName);
  if (tableNames.includes(META_TABLE)) return;

  await queryInterface.createTable(META_TABLE, {
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
      primaryKey: true,
    },
  });
}

async function getAppliedMigrations(queryInterface) {
  const rows = await queryInterface.sequelize.query(
    `SELECT name FROM \`${META_TABLE}\``,
    { type: Sequelize.QueryTypes.SELECT }
  );

  return new Set((rows || []).map((row) => row.name));
}

async function markMigrationAsApplied(queryInterface, migrationName) {
  await queryInterface.sequelize.query(
    `INSERT IGNORE INTO \`${META_TABLE}\` (name) VALUES (:name)`,
    {
      replacements: { name: migrationName },
      type: Sequelize.QueryTypes.INSERT,
    }
  );
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));
}

function resolveUpFunction(migrationModule) {
  if (typeof migrationModule?.up === 'function') return migrationModule.up;
  if (typeof migrationModule?.default?.up === 'function') return migrationModule.default.up;
  return null;
}

function expectsContextObject(fn) {
  const source = String(fn || '');
  return /\(\s*\{\s*context\b/.test(source);
}

async function executeMigrationUp(upFn, queryInterface) {
  if (upFn.length === 1 && expectsContextObject(upFn)) {
    await upFn({ context: queryInterface, Sequelize });
    return;
  }

  await upFn(queryInterface, Sequelize);
}

function isSafeAlreadyAppliedError(error) {
  const raw = `${error?.message || ''} ${error?.original?.message || ''}`;
  const message = raw.toLowerCase();
  const code = String(error?.original?.code || '').toUpperCase();

  const mysqlCodes = new Set([
    'ER_TABLE_EXISTS_ERROR',
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_CANT_DROP_FIELD_OR_KEY',
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
  ]);

  if (mysqlCodes.has(code)) return true;

  return (
    message.includes('already exists') ||
    message.includes('duplicate column name') ||
    message.includes('duplicate key name') ||
    message.includes("can't drop") ||
    message.includes('check that column/key exists') ||
    message.includes("doesn't exist") ||
    message.includes('unknown column')
  );
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated - running migrations from folder:', MIGRATIONS_DIR);

    const queryInterface = sequelize.getQueryInterface();
    await ensureMetaTable(queryInterface);

    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(queryInterface);

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const migrationFile of migrationFiles) {
      if (appliedMigrations.has(migrationFile)) {
        console.log(`[SKIP] ${migrationFile}`);
        continue;
      }

      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      console.log(`[RUN ] ${migrationFile}`);

      try {
        const migrationModule = await import(pathToFileURL(migrationPath).href);
        const upFn = resolveUpFunction(migrationModule);

        if (!upFn) {
          throw new Error(`Migration '${migrationFile}' does not export an up() function`);
        }

        await executeMigrationUp(upFn, queryInterface);
        await markMigrationAsApplied(queryInterface, migrationFile);
        console.log(`[OK  ] ${migrationFile}`);
      } catch (error) {
        if (isSafeAlreadyAppliedError(error)) {
          console.warn(`[WARN] ${migrationFile}: ${error.message}`);
          console.warn(`[WARN] Marking ${migrationFile} as applied to sync migration history.`);
          await markMigrationAsApplied(queryInterface, migrationFile);
          continue;
        }

        throw error;
      }
    }

    console.log('All pending migrations were processed successfully.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
