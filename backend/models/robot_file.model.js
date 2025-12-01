export default function defineRobotFileModel(sequelize, DataTypes) {
    const RobotFile = sequelize.define('RobotFile', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        competition_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        file_url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: true
        },
        is_public: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'RobotFiles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    RobotFile.associate = (models) => {
        RobotFile.belongsTo(models.Team, { foreignKey: 'team_id' });
        RobotFile.belongsTo(models.Competition, { foreignKey: 'competition_id' });
        RobotFile.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    };

    return RobotFile;
}
