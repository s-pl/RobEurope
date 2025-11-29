import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    // We need to use raw SQL because Sequelize's changeColumn doesn't always handle ENUM updates well in all dialects
    // and we want to be explicit about the new ENUM values.
    await queryInterface.sequelize.query(`
      ALTER TABLE Notification 
      MODIFY COLUMN type ENUM('registration_team_status', 'team_invite', 'mention', 'team_message') NOT NULL;
    `);
}

export async function down(queryInterface, Sequelize) {
    // Revert to the previous ENUM definition
    // Note: This might fail if there are rows with 'team_message' value.
    // In a real production scenario, we might want to handle that data loss or migration strategy.
    // For now, we'll just revert the schema definition.
    await queryInterface.sequelize.query(`
      ALTER TABLE Notification 
      MODIFY COLUMN type ENUM('registration_team_status', 'team_invite', 'mention') NOT NULL;
    `);
}
