export default function defineUser(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    profile_photo_url: { type: DataTypes.STRING },
    country_id: { type: DataTypes.BIGINT },
    role: { type: DataTypes.ENUM('super_admin', 'user'), defaultValue: 'user' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'USERS',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
}
