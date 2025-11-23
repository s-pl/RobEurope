import sequelize from '../controller/db.controller.js';

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connected');
    
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);

    const [results, metadata] = await sequelize.query("SELECT * FROM PostLike LIMIT 1");
    console.log('Query result:', results);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

check();
