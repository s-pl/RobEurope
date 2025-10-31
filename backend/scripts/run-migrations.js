import path from 'path';
import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';
import * as migration from '../migrations/20251031-create-initial-tables.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated — running migrations');
    const qi = sequelize.getQueryInterface();
    if (typeof migration.up !== 'function') {
      throw new Error('Migration file does not export an up() function');
    }
    await migration.up(qi, Sequelize);
    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
