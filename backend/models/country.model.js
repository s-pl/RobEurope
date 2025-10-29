import sequelize from "../controller/db.controller";
export default function defineCountry(sequelize, DataTypes) {
  return sequelize.define('Country', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(2), allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    flag_emoji: { type: DataTypes.STRING },
  }, {
    tableName: 'COUNTRIES',
    timestamps: false,
  });
}
