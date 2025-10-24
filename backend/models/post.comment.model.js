export default (sequelize, DataTypes) => {
  const PostComment = sequelize.define("PostComment", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    content: DataTypes.TEXT,
    isFlagged: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  PostComment.associate = (models) => {
    PostComment.belongsTo(models.Post, { foreignKey: "postId" });
    PostComment.belongsTo(models.User, { foreignKey: "userId" });
  };

  return PostComment;
};