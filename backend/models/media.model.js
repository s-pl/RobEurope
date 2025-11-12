export default function defineMediaModel(sequelize, DataTypes) {
    const Media = sequelize.define('Media', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        media_type: {
            type: DataTypes.ENUM('user', 'team', 'post', 'sponsor'),
            allowNull: false
        },
        media_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mime_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    Media.associate = (models) => {
        Media.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    };

    return Media;
}