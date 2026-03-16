export default function defineConversationParticipantModel(sequelize, DataTypes) {
    const ConversationParticipant = sequelize.define('ConversationParticipant', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        conversation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Conversation',
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
        role: {
            type: DataTypes.ENUM('admin', 'member'),
            defaultValue: 'member',
            allowNull: false
        },
        last_read_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        left_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'ConversationParticipants',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['conversation_id', 'user_id'],
                where: { left_at: null },
                name: 'unique_active_participant'
            }
        ]
    });

    ConversationParticipant.associate = (models) => {
        ConversationParticipant.belongsTo(models.Conversation, { foreignKey: 'conversation_id' });
        ConversationParticipant.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return ConversationParticipant;
}
