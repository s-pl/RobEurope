export default async function defineTeamMembersModel(sequelize, DataTypes) {
    const TeamMembers = sequelize.define('TeamMembers', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Team',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        left_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'TeamMembers', // Explicitly set table name to match migration
        timestamps: false // Migration didn't create createdAt/updatedAt for this table (only joined_at)
    });

    TeamMembers.associate = (models) => {
        TeamMembers.belongsTo(models.Team, {
            foreignKey: 'team_id',
            as: 'team'
        });
        TeamMembers.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return TeamMembers;
}
