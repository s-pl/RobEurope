import sequelize from '../controller/db.controller.js';
import { DataTypes } from 'sequelize';
import defineUser from './user.model.js';

const User = defineUser(sequelize, DataTypes);
const Country = defineCountry(sequelize, DataTypes);
// Sincroniza la base de datos (solo para desarrollo)
await sequelize.sync({ alter: true });



export {sequelize, User, Country};