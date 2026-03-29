export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('R2Stats', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    month: {
      type: Sequelize.STRING(7),
      allowNull: false,
      unique: true,
    },
    class_a_ops: {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    },
    class_b_ops: {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    },
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('R2Stats');
};
