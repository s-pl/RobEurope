export default async function defineMediaModel(sequelize, DataTypes) {
    const Media = sequelize.define('Media', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        original_name: {
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
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        thumbnail_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            }
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

    Media.associate = (models) => {
        Media.belongsTo(models.User, {
            foreignKey: 'uploaded_by',
            as: 'uploader'
        });
    };

    return Media;
}