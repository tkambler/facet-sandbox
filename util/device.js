const { knex } = require('./db');

const getDeviceDetails = async ({
  name,
  maxDistance,
}) => {

  const names = Array.isArray(name) ? name : [name];

  const devices = await knex('devices').select('*').whereIn('name', names);
  if (devices.length === 0) {
    throw new Error('no matching devices');
  }

  const { rows } = await knex.raw(`

  WITH RECURSIVE
  
  -- The traverseDown CTE is responsible for fetching devices that are descendants of devices
  -- found in the core result set.
  traverseDown (start_id, end_id, path, relationship_type) AS (
    SELECT
      de.start_id, de.end_id, array[de.start_id, de.end_id] AS path, 'descendent'
    FROM
      device_edges AS de
    WHERE
      de.start_id IN (${devices.map(d => `'${d.id}'`).join(',')})

    UNION ALL

    SELECT
      t.start_id, de.end_id, t.path || ARRAY[de.end_id], 'descendent'
    FROM
      device_edges AS de
    JOIN traverseDown AS t ON de.start_id = t.end_id and de.end_id != ALL(t.path)
),

-- The traverseUp CTE is responsible for fetching devices that are ancestors of devices
-- found in the core result set.
traverseUp (end_id, start_id, path, relationship_type) AS (
  SELECT
    de.end_id, de.start_id, array[de.end_id, de.start_id] AS path, 'ancestor'
  FROM
    device_edges AS de
  WHERE de.end_id IN (${devices.map(d => `'${d.id}'`).join(',')})
  
  UNION ALL

  SELECT
    t.end_id, de.start_id, t.path || ARRAY[de.start_id], 'ancestor'
  FROM
    device_edges AS de
  JOIN traverseUp AS t ON de.end_id = t.start_id and de.start_id != ALL(t.path)
)

select * from traverseDown
union all
select * from traverseUp

  `);

  const relatedDeviceIds = rows.reduce((result, row) => {
    row.path.forEach(p => {
      if (p && !result.includes(p)) {
        result.push(p);
      }
    });
    return result;
  }, []);

  const relatedDevices = relatedDeviceIds.length > 0 ? await knex('devices').select('*').whereIn('id', relatedDeviceIds) : [];

  for (const row of rows) {
    row.start = relatedDevices.find(device => device.id === row.start_id);
    row.end = relatedDevices.find(device => device.id === row.end_id);
  }

  return devices.map(device => {

    const ancestors = (() => {
      return rows.filter(row => {
        return row.relationship_type === 'ancestor' && row.start_id === device.id;
      });
    })();
  
    const descendants = (() => {
      return rows.filter(row => {
        return row.relationship_type === 'descendent' && row.start.id === device.id;
      });
    })();
  
    return {
      device,
      ancestors,
      descendants,
    };

  });

};

module.exports = {
  getDeviceDetails,
};
