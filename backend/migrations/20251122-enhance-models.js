export const up = async (queryInterface, Sequelize) => {
  // Competitions
  await queryInterface.changeColumn('Competition', 'description', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn('Competition', 'status', {
    type: Sequelize.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
  });
  await queryInterface.addColumn('Competition', 'location', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('Competition', 'max_teams', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });

  // Teams
  await queryInterface.addColumn('Team', 'description', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn('Team', 'website_url', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  // Users
  await queryInterface.addColumn('User', 'bio', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
};

export const down = async (queryInterface, Sequelize) => {
  // Users
  await queryInterface.removeColumn('User', 'bio');

  // Teams
  await queryInterface.removeColumn('Team', 'website_url');
  await queryInterface.removeColumn('Team', 'description');

  // Competitions
  await queryInterface.removeColumn('Competition', 'max_teams');
  await queryInterface.removeColumn('Competition', 'location');
  await queryInterface.removeColumn('Competition', 'status');
  await queryInterface.changeColumn('Competition', 'description', {
    type: Sequelize.STRING,
    allowNull: true,
  });
};
