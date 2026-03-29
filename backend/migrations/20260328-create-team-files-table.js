export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('TeamFiles', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    filename: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    original_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    mime_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    size: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    r2_key: {
      type: Sequelize.STRING(1024),
      allowNull: false,
    },
    url: {
      type: Sequelize.STRING(2048),
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('TeamFiles');
};
