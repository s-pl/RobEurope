export async function up(queryInterface, Sequelize) {
  // Update Competitions
  await queryInterface.bulkUpdate('Competition', 
    { 
      status: 'published',
      location: 'Madrid, Spain',
      max_teams: 20,
      description: 'The ultimate robotics competition in Europe.'
    },
    { id: [1, 2, 3] } // Assuming IDs 1, 2, 3 exist
  );

  // Update Teams
  await queryInterface.bulkUpdate('Team', 
    { 
      description: 'We are a passionate team of engineers.',
      website_url: 'https://team-example.com'
    },
    { id: 1 }
  );

  // Update Users (Superadmin)
  // We need to find the superadmin ID first or just update all for demo
  // Let's update the user with username 'superadmin'
  const superadminId = await queryInterface.rawSelect('User', { where: { username: 'superadmin' } }, 'id');
  if (superadminId) {
    await queryInterface.bulkUpdate('User', 
      { bio: 'I am the administrator of this platform.' },
      { id: superadminId }
    );
  }
}

export async function down(queryInterface, Sequelize) {
  // Revert changes if needed (set to null)
  await queryInterface.bulkUpdate('Competition', 
    { status: 'draft', location: null, max_teams: null },
    {}
  );
  await queryInterface.bulkUpdate('Team', 
    { description: null, website_url: null },
    {}
  );
  await queryInterface.bulkUpdate('User', 
    { bio: null },
    {}
  );
}
