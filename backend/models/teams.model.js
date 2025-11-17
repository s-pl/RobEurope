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
        logo_url: {
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

    Team.associate = (models) => {
        // Removed Media association
        Team.hasMany(models.Stream, {
            foreignKey: 'team_id',
            as: 'streams'
        });
    };

    return Team;
}