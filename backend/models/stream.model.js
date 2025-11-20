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
      type: DataTypes.TEXT,
      allowNull: true
    },
    stream_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('offline', 'scheduled', 'live'),
      defaultValue: 'offline',
      allowNull: false
    },
    competition_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false
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

  Stream.associate = (models) => {
    Stream.belongsTo(models.Competition, {
      foreignKey: 'competition_id',
      as: 'competition'
    });
    Stream.belongsTo(models.Team, {
      foreignKey: 'team_id',
      as: 'team'
    });
  };

  return Stream;
}
