export default function defineStreamModel(sequelize, DataTypes) {
  const Stream = sequelize.define('Stream', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    platform: {
      type: DataTypes.ENUM('twitch','youtube','kick'),
      allowNull: false,
      defaultValue: 'twitch'
    },
    stream_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_live: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    host_team_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    competition_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Stream;
}
