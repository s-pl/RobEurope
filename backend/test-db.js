import mysql from 'mysql2';
import dbconfig from './config/db.config.js';

const connection = mysql.createConnection({
  host: dbconfig.DB_HOST,
  port: dbconfig.DB_PORT,
  user: dbconfig.DB_USER,
  password: dbconfig.DB_PASS,
  database: dbconfig.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  } else {
    console.log('Connected successfully');
    connection.end();
  }
});