export async function up(queryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE DirectMessages
    MODIFY COLUMN type ENUM('text', 'file', 'image', 'system', 'ai') NOT NULL DEFAULT 'text';
  `);
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE DirectMessages
    MODIFY COLUMN type ENUM('text', 'file', 'image', 'system') NOT NULL DEFAULT 'text';
  `);
}
