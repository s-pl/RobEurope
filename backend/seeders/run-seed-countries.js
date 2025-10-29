import sequelize from '../controller/db.controller.js';
import seeder from './20251029152717-seed-countries.js';
import { Sequelize } from 'sequelize';

async function run() {
  try {
  console.log('Seeding: loading models and ensuring tables exist (sequelize.sync)');
  // Load models so they register with the sequelize instance before sync
  await import('../models/index.js');
  // In development only: create/alter tables to match models
  await sequelize.sync({ alter: true });

    console.log('Running countries seeder...');
    // queryInterface expected by the seeder
    const queryInterface = sequelize.getQueryInterface();
    // seeder export is the default object with up(queryInterface, Sequelize)
    if (!seeder || typeof seeder.up !== 'function') {
      throw new Error('Seeder module does not export an up(queryInterface, Sequelize) function');
    }

    await seeder.up(queryInterface, Sequelize);
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

run();
