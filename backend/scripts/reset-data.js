import sequelize from '../controller/db.controller.js';
import { execSync } from 'child_process';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected — truncating all tables');
    const qi = sequelize.getQueryInterface();

    // Disable FK checks (MySQL)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = await qi.showAllTables();
    // showAllTables can return objects depending on dialect; normalize to names
    const tableNames = tables.map(t => typeof t === 'object' ? t.tableName || Object.values(t)[0] : t).filter(Boolean);

    for (const tbl of tableNames) {
      try {
        console.log('Truncating', tbl);
        await sequelize.query(`TRUNCATE TABLE \`${tbl}\``);
      } catch (e) {
        console.warn('Could not truncate', tbl, e.message || e);
      }
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Running seeders to re-populate data');
    // Run existing seeder runner
    execSync('node scripts/run-seeders.js', { stdio: 'inherit' });
    console.log('Reset complete');
  } catch (err) {
    console.error('Reset error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
