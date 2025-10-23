export default (sequelize, DataTypes) => {
  const Stream = sequelize.define("Stream", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    streamStart: DataTypes.DATE,
    streamEnd: DataTypes.DATE,
    rtmpUrl: DataTypes.STRING,
    publicUrl: DataTypes.STRING,
  });

  Stream.associate = (models) => {
    Stream.belongsTo(models.Competition, { foreignKey: "competitionId" });
    Stream.belongsTo(models.User, { as: "creator", foreignKey: "createdBy" });
  };

  return Stream;
};