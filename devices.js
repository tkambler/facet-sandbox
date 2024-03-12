const { knex } = require('./util');

(async () => {

  const { rows } = await knex.raw(`

  WITH RECURSIVE data AS (
    SELECT
      id, addr, parent_id
    FROM
      devices
    WHERE
      id = '00070dbb-8d1c-4f3f-aa07-35c3fa825365'
    UNION
      SELECT
        d.id, d.addr, d.parent_id
      FROM
       devices d
      INNER JOIN data ON data.id = d.parent_id
  )
    SELECT * FROM data;
  `);

  console.log(JSON.stringify(rows, null, 2));

  await knex.destroy();

})();



/*

WITH RECURSIVE subordinates AS (
	SELECT
		employee_id,
		manager_id,
		full_name
	FROM
		employees
	WHERE
		employee_id = 2
	UNION
		SELECT
			e.employee_id,
			e.manager_id,
			e.full_name
		FROM
			employees e
		INNER JOIN subordinates s ON s.employee_id = e.manager_id
) SELECT
	*
FROM
	subordinates;

*/
