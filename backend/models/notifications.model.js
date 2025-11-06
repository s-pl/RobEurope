export default async function defineNotificationModel(sequelize, DataTypes) {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: { // Recipient user ID -> FK from users table
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User', 
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
         title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('registration_team_status', 'team_invite', 'mention'),
            allowNull: false
        },

        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
        
    });

    

    return Notification;
}