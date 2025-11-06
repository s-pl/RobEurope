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
            type: DataTypes.STRING,
            allowNull: true
        },
        country_id: {
            type: DataTypes.INTEGER, // o INTEGER, según tu tipo de ID
            allowNull: true,
            references: {
                model: 'Country', // tabla en la BD: 'Countries'
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
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
        stream_url: {
        type: DataTypes.JSON,
        allowNull: true
    }

    });

return Competition;
}