/**
 * @fileoverview
 * Team model definition for Sequelize ORM.
 * Represents robotics teams participating in competitions.
 * @module models/Team
 */

/**
 * @typedef {Object} TeamAttributes
 * @property {number} id - Auto-incrementing primary key.
 * @property {string} name - Team name.
 * @property {number} [country_id] - Foreign key to Country table.
 * @property {string} [city] - City where the team is located.
 * @property {string} [institution] - School or institution name.
 * @property {string} [description] - Team description.
 * @property {string} [website_url] - Team website URL.
 * @property {string} [logo_url] - URL to team logo.
 * @property {string} [stream_url] - Live stream URL.
 * @property {Object} [social_links] - JSON object with social media links.
 * @property {string} created_by_user_id - UUID of the user who created the team.
 * @property {Date} created_at - Creation timestamp.
 * @property {Date} updated_at - Last update timestamp.
 */

/**
 * Defines the Team model.
 * @param {Object} sequelize - Sequelize instance.
 * @param {Object} DataTypes - Sequelize DataTypes.
 * @returns {Object} The Team model.
 */
export default function defineTeamsModel(sequelize, DataTypes) {
    const Team = sequelize.define('Team', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        country_id: {
            type: DataTypes.INTEGER, // coincide con countries.id (INTEGER)
            allowNull: true,      // ajusta según necesites
            references: {
                model: 'Country', // tabla en la BD: 'Country'
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        institution: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        website_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        logo_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stream_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        social_links: {
            type: DataTypes.JSON,
            allowNull: true
        },
        created_by_user_id: {
            type: DataTypes.UUID,
            allowNull: true, // must allow NULL because onDelete: 'SET NULL'
            references: {
                model: 'User', // tabla en la BD: 'Users'
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
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

    /**
     * Defines model associations.
     * - Team has many Streams.
     * @param {Object} models - All registered models.
     */
    Team.associate = (models) => {
        // Removed Media association
        Team.hasMany(models.Stream, {
            foreignKey: 'team_id',
            as: 'streams'
        });
    };

    return Team;
}