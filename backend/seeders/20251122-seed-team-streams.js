export async function up(queryInterface, Sequelize) {
  // Update all existing teams to have a default stream URL or specific ones if needed
  // For demonstration, we'll update the team with id 1
  await queryInterface.bulkUpdate('Team', 
    { stream_url: 'https://twitch.tv/robeurope_team1' },
    { id: 1 }
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkUpdate('Team', 
    { stream_url: null },
    { id: 1 }
  );
}
