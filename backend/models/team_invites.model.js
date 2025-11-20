export default async function defineTeamInviteModel(sequelize, DataTypes) {
  const TeamInvite = sequelize.define('TeamInvite', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    team_id: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    user_id: { type: DataTypes.UUID, allowNull: true },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'revoked', 'expired'), defaultValue: 'pending' },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });

  return TeamInvite;
}
