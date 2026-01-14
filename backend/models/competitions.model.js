/**
 * @fileoverview
 * Competition model definition for Sequelize ORM.
 * Represents robotics competitions and events.
 * @module models/Competition
 */

/**
 * @typedef {Object} CompetitionAttributes
 * @property {number} id - Auto-incrementing primary key.
 * @property {string} title - Competition title.
 * @property {string} slug - URL-friendly identifier.
 * @property {string} [description] - Competition description.
 * @property {'draft'|'published'|'archived'} status - Publication status.
 * @property {string} [location] - Physical location of the competition.
 * @property {number} [max_teams] - Maximum number of teams allowed.
 * @property {Date} [registration_start] - When registration opens.
 * @property {Date} [registration_end] - When registration closes.
 * @property {Date} [start_date] - Competition start date.
 * @property {Date} [end_date] - Competition end date.
 * @property {string} [rules_url] - URL to competition rules document.
 * @property {boolean} is_active - Whether the competition is currently active.
 * @property {Object} [stream_url] - JSON object with streaming URLs.
 */

/**
 * Defines the Competition model.
 * @async
 * @param {Object} sequelize - Sequelize instance.
 * @param {Object} DataTypes - Sequelize DataTypes.
 * @returns {Promise<Object>} The Competition model.
 */
export default async function defineCompetitionsModel(sequelize, DataTypes) {
    const Competition = sequelize.define('Competition', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        max_teams: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        registration_start: {
        type: DataTypes.DATE,
        allowNull: true
    },
        registration_end: {
        type: DataTypes.DATE,
        allowNull: true
    },
        start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
        end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
        rules_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
        is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
        stream_url: {
        type: DataTypes.JSON,
        allowNull: true
    }

    });

    /**
     * Defines model associations.
     * - Competition has many Streams.
     * - Competition has many Registrations.
     * @param {Object} models - All registered models.
     */
    Competition.associate = (models) => {
        Competition.hasMany(models.Stream, {
            foreignKey: 'competition_id',
            as: 'streams'
        });
        // Link registrations to competitions for admin statistics and joins
        Competition.hasMany(models.Registration, {
            foreignKey: 'competition_id',
            as: 'registrations'
        });
    };

return Competition;
}