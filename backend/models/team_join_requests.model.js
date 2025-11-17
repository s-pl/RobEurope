export default async function defineTeamJoinRequestModel(sequelize, DataTypes) {
  const TeamJoinRequest = sequelize.define('TeamJoinRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    team_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });

  return TeamJoinRequest;
}
