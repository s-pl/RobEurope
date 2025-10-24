export default (sequelize, DataTypes) => {
  const Team = sequelize.define("Team", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  Team.associate = (models) => {
    Team.belongsTo(models.User, { as: "creator", foreignKey: "createdBy" });
    Team.belongsToMany(models.User, { through: models.TeamMember });
    Team.belongsToMany(models.Competition, { through: models.CompetitionRegistration });
  };

  return Team;
};