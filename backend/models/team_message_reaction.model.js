export default function defineTeamMessageReactionModel(sequelize, DataTypes) {
    const TeamMessageReaction = sequelize.define('TeamMessageReaction', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        message_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'TeamMessages',
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
            type: DataTypes.STRING(10), // Store the emoji character
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'TeamMessageReactions',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
        indexes: [
            {
                unique: true,
                fields: ['message_id', 'user_id', 'emoji']
            }
        ]
    });

    TeamMessageReaction.associate = (models) => {
        TeamMessageReaction.belongsTo(models.TeamMessage, { foreignKey: 'message_id' });
        TeamMessageReaction.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return TeamMessageReaction;
}
