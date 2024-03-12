const { dbIsRunning, knex, killDB, startDB, waitForDB, removeDBData, runMigrations, importData } = require('../util/db');

(async () => {

  if (await dbIsRunning()) {
    console.log('Destroying database...');
    await killDB();
  }
  await removeDBData();
  console.log('Starting database...');
  await startDB();
  console.log('Waiting for database to be ready...');
  await waitForDB();
  console.log('Running migrations...');
  await runMigrations() ;
  console.log('Seeding database...');
  await importData();
  console.log('Done.');
  await knex.destroy();

})();
