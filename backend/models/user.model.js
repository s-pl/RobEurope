export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE },
  });

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "roleId" });
    User.hasOne(models.UserProfile, { foreignKey: "userId" });
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
