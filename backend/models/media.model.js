export default (sequelize, DataTypes) => {
  const Media = sequelize.define("Media", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    filename: DataTypes.STRING,
    url: DataTypes.STRING,
    contentType: DataTypes.STRING,
    sizeBytes: DataTypes.BIGINT,
    altText: DataTypes.STRING,
  });

  Media.associate = (models) => {
    Media.belongsTo(models.User, { as: "uploader", foreignKey: "uploadedBy" });
  };

  return Media;
};