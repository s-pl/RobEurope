export default {
  async up(queryInterface, Sequelize) {
    // Check if Stream table exists and update it if necessary
    const tableExists = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'Stream'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists.length > 0) {
      // Table exists, check if it has the status column
      const columns = await queryInterface.describeTable('Stream');
      console.log('Stream table columns:', Object.keys(columns));

      if (!columns.status) {
        console.log('Adding status column to Stream table...');
        // Add status column if it doesn't exist
        await queryInterface.addColumn('Stream', 'status', {
          type: Sequelize.ENUM('offline', 'scheduled', 'live'),
          defaultValue: 'offline',
          allowNull: false
        });
        console.log('Stream table updated with status column');
      } else {
        console.log('Stream table already has status column');
      }

      if (!columns.team_id) {
        console.log('Adding team_id column to Stream table...');
        // Add team_id column if it doesn't exist
        await queryInterface.addColumn('Stream', 'team_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Team',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });
        console.log('Stream table updated with team_id column');
      } else {
        console.log('Stream table already has team_id column');
      }
    } else {
      // Table doesn't exist, create it
      await queryInterface.createTable('Stream', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        stream_url: {
          type: Sequelize.STRING,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('offline', 'scheduled', 'live'),
          defaultValue: 'offline',
          allowNull: false
        },
        competition_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Competition',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        team_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Team',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      console.log('Stream table created');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove status column if it exists
    try {
      const columns = await queryInterface.describeTable('Stream');
      if (columns.status) {
        await queryInterface.removeColumn('Stream', 'status');
      }
    } catch (error) {
      // Table might not exist, ignore
    }
  }
};