export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Team', 'stream_url', {
    type: Sequelize.STRING,
    allowNull: true,
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('Team', 'stream_url');
};
