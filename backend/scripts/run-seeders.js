import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';
import * as seeder from '../seeders/20251031-seed-superadmin.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated — running seeders');
    const qi = sequelize.getQueryInterface();
    if (typeof seeder.up !== 'function') {
      throw new Error('Seeder file does not export an up() function');
    }
    await seeder.up(qi, Sequelize);
    console.log('Seeders applied successfully');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
