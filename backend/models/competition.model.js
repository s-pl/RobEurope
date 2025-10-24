export default (sequelize, DataTypes) => {
  const Competition = sequelize.define("Competition", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    startAt: DataTypes.DATE,
    endAt: DataTypes.DATE,
    location: DataTypes.STRING,
    countryCode: DataTypes.STRING(2),
    status: { type: DataTypes.STRING, defaultValue: "draft" },
  });

  Competition.associate = (models) => {
    Competition.belongsTo(models.User, { as: "creator", foreignKey: "createdBy" });
    Competition.hasMany(models.CompetitionMedia, { foreignKey: "competitionId" });
    Competition.belongsToMany(models.Team, { through: models.CompetitionRegistration });
    Competition.hasMany(models.Stream, { foreignKey: "competitionId" });
  };

  return Competition;
};