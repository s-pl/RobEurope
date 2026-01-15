/**
 * @fileoverview Gallery Demo Seeder
 * Creates demo gallery images/videos for RobEurope presentation
 * Real robotics content in English
 */

// Superadmin UUID for uploaded_by reference
const SUPERADMIN_ID = '00000000-0000-0000-0000-000000000001';

export async function up(queryInterface, Sequelize) {
  const now = new Date();

  // First verify superadmin exists
  let uploaderId = await queryInterface.rawSelect('User', { where: { username: 'superadmin' } }, 'id');
  if (!uploaderId) {
    uploaderId = SUPERADMIN_ID;
  }

  const galleryItems = [
    {
      filename: 'industrial-robot-arm.jpg',
      original_name: 'industrial-robot-arm.jpg',
      mime_type: 'image/jpeg',
      size: 2500000,
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',
      title: 'Industrial Robot Arm in Action',
      description: 'A high-precision industrial robot arm performing automated assembly tasks in a modern manufacturing facility.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-20'),
      updated_at: now
    },
    {
      filename: 'humanoid-robot.jpg',
      original_name: 'humanoid-robot.jpg',
      mime_type: 'image/jpeg',
      size: 1800000,
      url: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=1200',
      title: 'Humanoid Robot Technology',
      description: 'Advanced humanoid robot showcasing the latest developments in bipedal locomotion and human-robot interaction.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-21'),
      updated_at: now
    },
    {
      filename: 'robot-competition-arena.jpg',
      original_name: 'robot-competition-arena.jpg',
      mime_type: 'image/jpeg',
      size: 2100000,
      url: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=1200',
      title: 'Robotics Competition Arena',
      description: 'Teams competing in an international robotics championship with autonomous robots navigating complex challenges.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-21'),
      updated_at: now
    },
    {
      filename: 'drone-technology.jpg',
      original_name: 'drone-technology.jpg',
      mime_type: 'image/jpeg',
      size: 1950000,
      url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200',
      title: 'Autonomous Drone Systems',
      description: 'Cutting-edge autonomous drone equipped with advanced sensors for precision navigation and obstacle avoidance.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-19'),
      updated_at: now
    },
    {
      filename: 'robot-hand-ai.jpg',
      original_name: 'robot-hand-ai.jpg',
      mime_type: 'image/jpeg',
      size: 1600000,
      url: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=1200',
      title: 'AI-Powered Robotic Hand',
      description: 'Sophisticated robotic hand with artificial intelligence capabilities demonstrating fine motor control.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-18'),
      updated_at: now
    },
    {
      filename: 'boston-dynamics-spot.jpg',
      original_name: 'boston-dynamics-spot.jpg',
      mime_type: 'image/jpeg',
      size: 2300000,
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      title: 'Quadruped Robot Navigation',
      description: 'Four-legged robot demonstrating remarkable balance and terrain adaptation capabilities.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-21'),
      updated_at: now
    },
    {
      filename: 'circuit-board-robotics.jpg',
      original_name: 'circuit-board-robotics.jpg',
      mime_type: 'image/jpeg',
      size: 1400000,
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      title: 'Robotics Electronics Workshop',
      description: 'Close-up of advanced circuit boards and microcontrollers used in competitive robotics.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-04-15'),
      updated_at: now
    },
    {
      filename: 'collaborative-robots.jpg',
      original_name: 'collaborative-robots.jpg',
      mime_type: 'image/jpeg',
      size: 1750000,
      url: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1200',
      title: 'Collaborative Robots (Cobots)',
      description: 'Human-robot collaboration in action: cobots working safely alongside human operators.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-17'),
      updated_at: now
    },
    {
      filename: 'robot-vision-system.jpg',
      original_name: 'robot-vision-system.jpg',
      mime_type: 'image/jpeg',
      size: 2000000,
      url: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=1200',
      title: 'Computer Vision for Robotics',
      description: 'Advanced computer vision system enabling robots to perceive and understand their environment.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-07-18'),
      updated_at: now
    },
    {
      filename: 'stem-robotics-education.jpg',
      original_name: 'stem-robotics-education.jpg',
      mime_type: 'image/jpeg',
      size: 1550000,
      url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200',
      title: 'STEM Robotics Education',
      description: 'Young engineers learning robotics fundamentals through hands-on projects and competitions.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-06-05'),
      updated_at: now
    },
    {
      filename: 'surgical-robot.jpg',
      original_name: 'surgical-robot.jpg',
      mime_type: 'image/jpeg',
      size: 1900000,
      url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200',
      title: 'Medical Surgical Robot',
      description: 'State-of-the-art surgical robot enabling minimally invasive procedures with unprecedented precision.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-09-10'),
      updated_at: now
    },
    {
      filename: '3d-printed-robot.jpg',
      original_name: '3d-printed-robot.jpg',
      mime_type: 'image/jpeg',
      size: 1650000,
      url: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=1200',
      title: '3D Printed Robot Components',
      description: 'Custom 3D printed robot parts demonstrating rapid prototyping capabilities for competitive robotics.',
      uploaded_by: uploaderId,
      created_at: new Date('2025-09-15'),
      updated_at: now
    }
  ];

  for (const item of galleryItems) {
    try {
      const exists = await queryInterface.rawSelect('Gallery', { where: { filename: item.filename } }, 'id');
      if (!exists) {
        await queryInterface.bulkInsert('Gallery', [item], {});
        console.log(`✓ Gallery "${item.title}" created`);
      } else {
        console.log(`- Gallery "${item.title}" already exists`);
      }
    } catch (e) {
      console.warn(`Gallery "${item.title}": ${e.message}`);
    }
  }

  console.log('✅ Gallery seeding complete');
}

export async function down(queryInterface, Sequelize) {
  const filenames = [
    'industrial-robot-arm.jpg',
    'humanoid-robot.jpg',
    'robot-competition-arena.jpg',
    'drone-technology.jpg',
    'robot-hand-ai.jpg',
    'boston-dynamics-spot.jpg',
    'circuit-board-robotics.jpg',
    'collaborative-robots.jpg',
    'robot-vision-system.jpg',
    'stem-robotics-education.jpg',
    'surgical-robot.jpg',
    '3d-printed-robot.jpg'
  ];

  for (const filename of filenames) {
    try {
      await queryInterface.bulkDelete('Gallery', { filename }, {});
    } catch (e) {
      console.warn(`Could not delete ${filename}: ${e.message}`);
    }
  }

  console.log('✅ Gallery rollback complete');
}
