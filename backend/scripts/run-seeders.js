import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Ordered list of seeders to run. Add new seeders here in the required order.
const seeders = [
  '../seeders/20251031-seed-superadmin.js',
  '../seeders/20251106-seed-competitions.js',
  '../seeders/20251106-seed-team-members.js',
  '../seeders/20251106-seed-registrations.js',
  '../seeders/20251106-seed-posts.js',
  '../seeders/20251106-seed-sponsors.js',
  '../seeders/20251106-seed-notifications.js',
  '../seeders/country_seeder.js',
  '../seeders/20251117-seed-streams.js',
  '../seeders/20251122-seed-team-streams.js',
  '../seeders/20251122-seed-enhanced-data.js',
  '../seeders/20260115-seed-sponsors-demo.js',
  '../seeders/20260115-seed-gallery-demo.js'
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated — running seeders');
    const qi = sequelize.getQueryInterface();

    for (const relPath of seeders) {
      try {
        const seederPath = path.resolve(__dirname, relPath);
        const seederUrl = pathToFileURL(seederPath).href;
        const module = await import(seederUrl);
        const upFn = module.up || module.default?.up || module.default;
        if (typeof upFn !== 'function') {
          console.warn(`Skipping seeder ${relPath}: no exported up() function found`);
          continue;
        }
        console.log(`Running seeder: ${relPath}`);
        await upFn(qi, Sequelize);
      } catch (innerErr) {
        console.error(`Error running seeder ${relPath}:`, innerErr);
        throw innerErr; // bubble up to abort
      }
    }

    console.log('All seeders applied successfully');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
