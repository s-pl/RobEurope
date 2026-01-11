/**
 * @fileoverview Sequelize model definition for in-app notifications.
 */

/**
 * @typedef {Object} NotificationMeta
 * @property {string} [kind] A high-level discriminator for the meta payload.
 * @property {string} [invite_token] Team invitation token (used to accept/decline invites).
 * @property {number} [team_id] Team id related to the notification.
 * @property {string} [team_name] Team display name.
 */

/**
 * Defines the Notification model.
 *
 * Notifications are stored for a specific recipient user and can optionally carry a
 * JSON `meta` payload for actionable notifications.
 *
 * @param {Sequelize} sequelize Sequelize instance.
 * @param {DataTypes} DataTypes Sequelize DataTypes.
 * @returns {Model} Notification model.
 */
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
            type: DataTypes.ENUM('registration_team_status', 'team_invite', 'mention', 'team_message'),
            allowNull: false
        },

        meta: {
            type: DataTypes.JSON,
            allowNull: true
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