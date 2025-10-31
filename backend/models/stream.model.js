export default (sequelize, DataTypes) => {
  return sequelize.define('Stream', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    platform: { type: DataTypes.ENUM('twitch', 'youtube', 'kick'), allowNull: false, defaultValue: 'twitch' },
    stream_url: { type: DataTypes.STRING },
    is_live: { type: DataTypes.BOOLEAN, defaultValue: false },
    host_team_id: { type: DataTypes.BIGINT },
    competition_id: { type: DataTypes.BIGINT },
    created_at: { type: DataTypes.DATE }
  }, {
    tableName: 'STREAMS',
    timestamps: false
  });
};