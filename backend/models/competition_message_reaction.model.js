export default function defineCompetitionMessageReactionModel(sequelize, DataTypes) {
    const CompetitionMessageReaction = sequelize.define('CompetitionMessageReaction', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        message_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'CompetitionMessage',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'CompetitionMessageReactions',
        timestamps: true,
        updatedAt: false
    });

    CompetitionMessageReaction.associate = (models) => {
        CompetitionMessageReaction.belongsTo(models.CompetitionMessage, { foreignKey: 'message_id' });
        CompetitionMessageReaction.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return CompetitionMessageReaction;
}
