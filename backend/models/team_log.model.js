export default function defineTeamLogModel(sequelize, DataTypes) {
    const TeamLog = sequelize.define('TeamLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        competition_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        author_id: {
            type: DataTypes.UUID,
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

    TeamLog.associate = (models) => {
        TeamLog.belongsTo(models.Team, { foreignKey: 'team_id' });
        TeamLog.belongsTo(models.Competition, { foreignKey: 'competition_id' });
        TeamLog.belongsTo(models.User, { foreignKey: 'author_id', as: 'author' });
    };

    return TeamLog;
}
