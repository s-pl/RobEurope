export default function defineTeamMessageModel(sequelize, DataTypes) {
    const TeamMessage = sequelize.define('TeamMessage', {
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
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true // Can be null if it's just a file
        },
        type: {
            type: DataTypes.ENUM('text', 'file', 'image'),
            defaultValue: 'text'
        },
        file_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        attachments: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'TeamMessages',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at'
    });

    TeamMessage.associate = (models) => {
        TeamMessage.belongsTo(models.Team, { foreignKey: 'team_id' });
        TeamMessage.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return TeamMessage;
}
