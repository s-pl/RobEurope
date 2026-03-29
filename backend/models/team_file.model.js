export default function defineTeamFileModel(sequelize, DataTypes) {
  const TeamFile = sequelize.define('TeamFile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Team', key: 'id' },
      onDelete: 'CASCADE',
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE',
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    r2_key: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'TeamFiles',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  });

  TeamFile.associate = (models) => {
    TeamFile.belongsTo(models.Team, { foreignKey: 'team_id' });
    TeamFile.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
  };

  return TeamFile;
}
