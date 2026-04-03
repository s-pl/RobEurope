export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('User', 'auth0_id', {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true,
  });

  // Make password_hash nullable (Auth0 users have no local password)
  await queryInterface.changeColumn('User', 'password_hash', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('User', 'auth0_id');
  await queryInterface.changeColumn('User', 'password_hash', {
    type: Sequelize.STRING,
    allowNull: false,
  });
}
