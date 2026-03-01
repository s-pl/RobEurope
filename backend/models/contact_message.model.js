export default async function defineContactMessageModel(sequelize, DataTypes) {
  const ContactMessage = sequelize.define('ContactMessage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(200), allowNull: false },
    organization: { type: DataTypes.STRING(200), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'ContactMessage', underscored: false });

  return ContactMessage;
}
