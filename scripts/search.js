const { knex } = require('../util/db');

(async () => {

  const documents = await knex('documents').select('*');
  console.log(JSON.stringify(documents, null, 2));

  await knex.destroy();

})();
