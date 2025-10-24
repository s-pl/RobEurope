export default (sequelize, DataTypes) => {
  const Role = sequelize.define("Role", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true },
    description: { type: DataTypes.STRING },
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: "roleId" });
  };

  return Role;
};