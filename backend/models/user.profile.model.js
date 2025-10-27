export default (sequelize, DataTypes) => {
  const UserProfile = sequelize.define("UserProfile", {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    school: DataTypes.STRING,
    countryCode: DataTypes.STRING(2),
    bio: DataTypes.TEXT,
    avatarUrl: DataTypes.STRING,
  });

  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.User, { foreignKey: "userId" });
  };

  return UserProfile;
};