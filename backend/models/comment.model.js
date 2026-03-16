export default function defineCommentModel(sequelize, DataTypes) {
    const Comment = sequelize.define('Comment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        post_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Post',
                key: 'id'
            }
        },
        author_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            }
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Comment',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
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
        tableName: 'Comment'
    });

    Comment.associate = (models) => {
        Comment.belongsTo(models.Post, { foreignKey: 'post_id' });
        Comment.belongsTo(models.User, { foreignKey: 'author_id' });
        Comment.belongsTo(models.Comment, { as: 'parent', foreignKey: 'parent_id' });
        Comment.hasMany(models.Comment, { as: 'replies', foreignKey: 'parent_id' });
    };

    return Comment;
}
