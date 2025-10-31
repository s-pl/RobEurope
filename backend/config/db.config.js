import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';

console.log('DB_HOST:', process.env.DB_HOST); 

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, 
      },
    },
    logging: false, 
  }
);

// Probar la conexión
try {
  await sequelize.authenticate();
  console.log(`Succesfully conected to db ${process.env.DB_NAME} en ${process.env.DB_HOST}`);
} catch (error) {
  console.error('There was an error while connecting to the database', error);
}

export default sequelize;
