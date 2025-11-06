import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { DataTypes } from 'sequelize';
import sequelize from '../controller/db.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = {};
db.sequelize = sequelize;
db.DataTypes = DataTypes;

const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.model.js') && f !== 'index.js');

for (const file of files) {
  const modelPath = path.join(__dirname, file);
  const modelDef = (await import(pathToFileURL(modelPath).href)).default;
  const model = await modelDef(sequelize, DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach((name) => {
  if (db[name].associate) db[name].associate(db);
});

export default db;