export default (sequelize, DataTypes) => {
  const CompetitionMedia = sequelize.define("CompetitionMedia", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mediaKind: DataTypes.STRING,
    caption: DataTypes.STRING,
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  });

  CompetitionMedia.associate = (models) => {
    CompetitionMedia.belongsTo(models.Competition, { foreignKey: "competitionId" });
    CompetitionMedia.belongsTo(models.Media, { foreignKey: "mediaId" });
  };

  return CompetitionMedia;
};