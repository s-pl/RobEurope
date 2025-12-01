export default function defineCompetitionMessageModel(sequelize, DataTypes) {
    const CompetitionMessage = sequelize.define('CompetitionMessage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        competition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Competition',
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
            allowNull: true
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
        tableName: 'CompetitionMessages',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at'
    });

    CompetitionMessage.associate = (models) => {
        CompetitionMessage.belongsTo(models.Competition, { foreignKey: 'competition_id' });
        CompetitionMessage.belongsTo(models.User, { foreignKey: 'user_id' });
        CompetitionMessage.hasMany(models.CompetitionMessageReaction, { foreignKey: 'message_id', as: 'Reactions' });
    };

    return CompetitionMessage;
}
