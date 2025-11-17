export default async function defineRegistrationModel(sequelize, DataTypes) {
    const Registration = sequelize.define('Registration', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_id: {
            type: DataTypes.INTEGER, // coincide con teams.model.js (id: INTEGER)
            allowNull: true,         // necesario si onDelete: 'SET NULL'
            references: {
                model: 'Team',      // tabla en la BD: 'Teams'
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        competition_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Competition',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        },
        decision_reason: {
            type: DataTypes.STRING,
            allowNull: true
        },
        registration_date: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    return Registration;
}