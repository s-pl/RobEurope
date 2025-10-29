export default (sequelize, DataTypes) => {
  return sequelize.define('User', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    profile_photo_url: { type: DataTypes.STRING },
    country_id: { type: DataTypes.BIGINT },
    role: { type: DataTypes.ENUM('super_admin', 'user'), allowNull: false, defaultValue: 'user' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    // created_at and updated_at will be set by controllers to avoid DB-specific SQL defaults
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE }
  }, {
    tableName: 'USERS',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['country_id'] }
    ]
  });
};
