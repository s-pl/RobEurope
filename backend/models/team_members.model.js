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
    });

    return TeamMembers;
}
