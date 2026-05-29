import { generateLoomRailsApp } from './generator';

async function run() {
  console.log('🚀 Testing generateLoomRailsApp with SQLite, no Mobile, no Kamal...');
  await generateLoomRailsApp({
    projectName: 'test-sqlite-web-only',
    includeMobile: false,
    database: 'sqlite3',
    includeKamal: false
  });
  console.log('✨ Programmatic test completed successfully!');
}

run().catch(console.error);
