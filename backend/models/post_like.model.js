export default function definePostLikeModel(sequelize, DataTypes) {
    const PostLike = sequelize.define('PostLike', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        post_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Post',
                key: 'id'
            }
        },
        user_id: {
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
        }
    }, {
        timestamps: false,
        tableName: 'PostLike'
    });

    PostLike.associate = (models) => {
        PostLike.belongsTo(models.Post, { foreignKey: 'post_id' });
        PostLike.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return PostLike;
}
