/**
 * Migration: Add slug to Team table and create team_pages table
 */
export async function up(queryInterface, Sequelize) {
  // 1. Add slug column to Team table
  await queryInterface.addColumn('Team', 'slug', {
    type: Sequelize.STRING(100),
    allowNull: true,
    unique: true
  });

  // 2. Add index for fast slug lookups
  await queryInterface.addIndex('Team', ['slug'], {
    unique: true,
    name: 'team_slug_unique'
  });

  // 3. Backfill existing teams with slugs derived from their names
  const [teams] = await queryInterface.sequelize.query(
    'SELECT id, name FROM `Team`'
  );

  for (const team of teams) {
    const base = team.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);

    let slug = base || `equipo-${team.id}`;
    let suffix = 0;

    // Ensure uniqueness
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const [rows] = await queryInterface.sequelize.query(
        'SELECT id FROM `Team` WHERE slug = ? AND id != ?',
        { replacements: [candidate, team.id] }
      );
      if (rows.length === 0) {
        slug = candidate;
        break;
      }
      suffix++;
    }

    await queryInterface.sequelize.query(
      'UPDATE `Team` SET slug = ? WHERE id = ?',
      { replacements: [slug, team.id] }
    );
  }

  // 4. Create team_pages table
  await queryInterface.createTable('TeamPage', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    // JSON array of module objects: [{id, type, col, row, w, h, config}]
    layout: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    },
    // Available themes: 'default', 'dark', 'tech', 'minimal', 'vibrant'
    theme: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'default'
    },
    // Optional custom CSS injected in the page
    custom_css: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    // Hero image URL for the page banner
    hero_image_url: {
      type: Sequelize.STRING,
      allowNull: true
    },
    // Accent color (hex) for theming
    accent_color: {
      type: Sequelize.STRING(7),
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('TeamPage');
  await queryInterface.removeIndex('Team', 'team_slug_unique');
  await queryInterface.removeColumn('Team', 'slug');
}
