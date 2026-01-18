export default async function defineGalleryModel(sequelize, DataTypes) {
  const Gallery = sequelize.define('Gallery', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    media_type: {
      type: DataTypes.ENUM('image', 'video'),
      defaultValue: 'image',
      allowNull: false
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    competition_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Competition',
        key: 'id'
      }
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
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

  Gallery.associate = (models) => {
    Gallery.belongsTo(models.User, {
      foreignKey: 'uploaded_by',
      as: 'uploader'
    });
    if (models.Competition) {
      Gallery.belongsTo(models.Competition, {
        foreignKey: 'competition_id',
        as: 'competition'
      });
    }
  };

  return Gallery;
}
