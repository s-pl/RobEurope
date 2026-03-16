export default function defineDirectMessageModel(sequelize, DataTypes) {
    const DirectMessage = sequelize.define('DirectMessage', {
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
        sender_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'User',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('text', 'file', 'image', 'system', 'ai'),
            defaultValue: 'text'
        },
        file_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        file_mime_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reply_to_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'DirectMessages',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        is_edited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        tableName: 'DirectMessages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    DirectMessage.associate = (models) => {
        DirectMessage.belongsTo(models.Conversation, { foreignKey: 'conversation_id' });
        DirectMessage.belongsTo(models.User, { as: 'sender', foreignKey: 'sender_id' });
        DirectMessage.belongsTo(models.DirectMessage, { as: 'replyTo', foreignKey: 'reply_to_id' });
    };

    return DirectMessage;
}
