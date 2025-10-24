export default (sequelize, DataTypes) => {
  const TeamMember = sequelize.define("TeamMember", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    roleInTeam: DataTypes.STRING,
  });
  return TeamMember;
};