export default function definePostsModel(sequelize, DataTypes) {
    const Post = sequelize.define('Post', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        author_id: {
            type: DataTypes.UUID,           // coincide con users.id (UUID)
            allowNull: true,                // necesario si onDelete: 'SET NULL'
            references: {
                model: 'User',             // tabla en la BD: 'Users'
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        media_urls: {
            type: DataTypes.JSON,
            allowNull: true
        },
        likes_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        views_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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

    Post.associate = (models) => {
        Post.hasMany(models.Media, { foreignKey: 'media_id', constraints: false, scope: { media_type: 'post' } });
    };

    return Post;
}