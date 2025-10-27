export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE },
  });

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "roleId" });
    // Each User has one UserProfile. Use an alias for clarity and enforce FK constraints.
    User.hasOne(models.UserProfile, {
      as: 'profile',
      foreignKey: { name: 'userId', allowNull: false },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      hooks: true,
    });
    User.hasMany(models.Post, { foreignKey: "authorId" });
    User.hasMany(models.Team, { foreignKey: "createdBy" });
    User.belongsToMany(models.Team, { through: models.TeamMember });
    // Optional Notification model
    if (models.Notification) {
      User.hasMany(models.Notification, { foreignKey: "userId" });
    }
    // Media uploads
    if (models.Media) {
      User.hasMany(models.Media, { as: "uploads", foreignKey: "uploadedBy" });
    }
  };

  return User;
};
