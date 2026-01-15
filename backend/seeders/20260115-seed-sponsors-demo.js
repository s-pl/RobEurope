/**
 * @fileoverview Sponsors Demo Seeder
 * Creates demo sponsors for RobEurope presentation
 */

export async function up(queryInterface, Sequelize) {
  const now = new Date();

  const sponsors = [
    {
      name: 'TechCorp Europe',
      logo_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&h=400&fit=crop',
      website_url: 'https://techcorp-europe.com',
      created_at: now,
      updated_at: now
    },
    {
      name: 'Arduino Foundation',
      logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Arduino_Logo.svg/720px-Arduino_Logo.svg.png',
      website_url: 'https://arduino.cc',
      created_at: now,
      updated_at: now
    },
    {
      name: 'European Robotics Association',
      logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
      website_url: 'https://eu-robotics.net',
      created_at: now,
      updated_at: now
    },
    {
      name: 'MakerSpace Berlin',
      logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop',
      website_url: 'https://makerspace-berlin.de',
      created_at: now,
      updated_at: now
    },
    {
      name: 'RoboMaterials S.L.',
      logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
      website_url: 'https://robomaterials.es',
      created_at: now,
      updated_at: now
    },
    {
      name: 'FutureTech Labs',
      logo_url: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400&h=400&fit=crop',
      website_url: 'https://futuretech-labs.eu',
      created_at: now,
      updated_at: now
    },
    {
      name: 'Raspberry Pi Foundation',
      logo_url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3b/Raspberry_Pi_logo.svg/1200px-Raspberry_Pi_logo.svg.png',
      website_url: 'https://raspberrypi.org',
      created_at: now,
      updated_at: now
    },
    {
      name: 'NVIDIA',
      logo_url: 'https://upload.wikimedia.org/wikipedia/sco/thumb/2/21/Nvidia_logo.svg/1200px-Nvidia_logo.svg.png',
      website_url: 'https://nvidia.com',
      created_at: now,
      updated_at: now
    }
  ];

  for (const sponsor of sponsors) {
    try {
      const exists = await queryInterface.rawSelect('Sponsor', { where: { name: sponsor.name } }, 'id');
      if (!exists) {
        await queryInterface.bulkInsert('Sponsor', [sponsor], {});
        console.log(`✓ Sponsor "${sponsor.name}" created`);
      } else {
        console.log(`- Sponsor "${sponsor.name}" already exists`);
      }
    } catch (e) {
      console.warn(`Sponsor "${sponsor.name}": ${e.message}`);
    }
  }

  console.log('✅ Sponsors seeding complete');
}

export async function down(queryInterface, Sequelize) {
  const sponsorNames = [
    'TechCorp Europe',
    'Arduino Foundation', 
    'European Robotics Association',
    'MakerSpace Berlin',
    'RoboMaterials S.L.',
    'FutureTech Labs',
    'Raspberry Pi Foundation',
    'NVIDIA'
  ];

  for (const name of sponsorNames) {
    await queryInterface.bulkDelete('Sponsor', { name }, {});
  }
  
  console.log('🗑️ Demo sponsors removed');
}
