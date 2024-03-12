module.exports = {
  up: async (knex) => {

    await knex.schema.raw(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE EXTENSION roaringbitmap;

      CREATE EXTENSION pgfaceting;

      CREATE TABLE documents (
        id uuid primary key,
        created timestamptz not null default now(),
        finished timestamptz,
        category_id uuid not null,
        tags text[],
        mimetype text,
        size int8,
        title text
      );

      SELECT faceting.add_faceting_to_table(
        'documents',
        key => 'id',
        facets => array[
            faceting.datetrunc_facet('created', 'month'),
            faceting.datetrunc_facet('finished', 'month'),
            faceting.plain_facet('category_id'),
            faceting.plain_facet('mimetype'),
            faceting.bucket_facet('size', buckets => array[0,1000,5000,10000,50000,100000,500000])
        ]
      );
    `);

  },
  down: async (knex) => {
  },
};
