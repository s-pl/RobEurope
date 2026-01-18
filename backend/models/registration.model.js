export default async function defineRegistrationModel(sequelize, DataTypes) {
    const Registration = sequelize.define('Registration', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Team',
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
        // Center admin approval fields
        center_approval_status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        },
        center_approved_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'User',
                key: 'id'
            }
        },
        center_approval_reason: {
            type: DataTypes.STRING,
            allowNull: true
        },
        center_approved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // Password-based registration fields
        registration_password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_password_registration: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        registration_date: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    Registration.associate = (models) => {
        Registration.belongsTo(models.Team, { foreignKey: 'team_id' });
        Registration.belongsTo(models.Competition, { foreignKey: 'competition_id' });
        if (models.User) {
            Registration.belongsTo(models.User, { 
                foreignKey: 'center_approved_by',
                as: 'centerApprover'
            });
        }
    };

    return Registration;
}