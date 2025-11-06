import sequelize from '../controller/db.controller.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected — dropping all tables');
    const qi = sequelize.getQueryInterface();
    await qi.dropAllTables();
    console.log('All tables dropped');
  } catch (err) {
    console.error('Drop error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
