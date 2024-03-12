const { dbIsRunning, killDB, knex } = require('../util/db');

(async () => {
  if (await dbIsRunning()) {
    console.log('Destroying database...');
    await killDB();
  } else {
    console.log('Database is not running.');
  }
  await knex.destroy();
})();
