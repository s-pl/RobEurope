export default function defineSystemLogModel(sequelize, DataTypes) {
    const SystemLog = sequelize.define('SystemLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'User',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'User who performed the action (null for system actions)'
        },
        action: {
            type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'UPLOAD', 'DOWNLOAD'),
            allowNull: false
        },
        entity_type: {
            type: DataTypes.ENUM('User', 'Team', 'Post', 'Competition', 'Sponsor', 'Stream', 'Registration', 'Notification', 'Country', 'TeamMember', 'System'),
            allowNull: false,
            comment: 'Type of entity being acted upon'
        },
        entity_id: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'ID of the entity (string to accommodate UUID and integer IDs)'
        },
        old_values: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Previous values (for UPDATE operations)'
        },
        new_values: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'New values (for CREATE and UPDATE operations)'
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'IP address of the user'
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'User agent string from browser/device'
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional details about the operation'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    }, {
        timestamps: false, // We only use created_at, no updated_at for logs
        indexes: [
            {
                fields: ['user_id'],
                name: 'system_log_user_id_idx'
            },
            {
                fields: ['entity_type', 'entity_id'],
                name: 'system_log_entity_idx'
            },
            {
                fields: ['action'],
                name: 'system_log_action_idx'
            },
            {
                fields: ['created_at'],
                name: 'system_log_created_at_idx'
            }
        ]
    });

    SystemLog.associate = (models) => {
        // Association with User (who performed the action)
        SystemLog.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return SystemLog;
}