export default function defineConversationModel(sequelize, DataTypes) {
    const Conversation = sequelize.define('Conversation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM('direct', 'group'),
            defaultValue: 'direct',
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        avatar_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            }
        },
        last_message_at: {
            type: DataTypes.DATE,
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
    }, {
        tableName: 'Conversations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Conversation.associate = (models) => {
        Conversation.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
        Conversation.hasMany(models.ConversationParticipant, { foreignKey: 'conversation_id' });
        Conversation.hasMany(models.DirectMessage, { foreignKey: 'conversation_id' });
    };

    return Conversation;
}
