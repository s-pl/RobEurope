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