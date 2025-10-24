export default (sequelize, DataTypes) => {
  const Post = sequelize.define("Post", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: DataTypes.STRING,
    slug: { type: DataTypes.STRING, unique: true },
    content: DataTypes.TEXT,
    excerpt: DataTypes.TEXT,
    status: { type: DataTypes.STRING, defaultValue: "draft" },
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, { as: "author", foreignKey: "authorId" });
    Post.hasMany(models.PostComment, { foreignKey: "postId" });
  };

  return Post;
};