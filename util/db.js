const Docker = require('dockerode');
const fs = require('fs-extra');
const execa = require('execa');
const path = require('path');
const pRetry = require('p-retry');
const delay = require('delay');

const docker = new Docker();

const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    port : 5439,
    user : 'postgres',
    password : 'password',
    database : 'postgres',
  },
});

const killDB = async () => {
  try {
    await execa('docker-compose', ['down'], {
      cwd: path.resolve(__dirname, '..'),
    });
    await execa('docker-compose', ['rm', '-f'], {
      cwd: path.resolve(__dirname, '..'),
    });
    await delay(1000);
  } catch(err) {}
};

const dbIsRunning = async () => {
  const containers = await docker.listContainers();
  return containers.some(container => container.Labels['com.example.name'] === 'pg-facet-db');
};

const removeDBData = async () => {
  await fs.remove(path.resolve(__dirname, '../db'));
};

const startDB = async () => {
  await execa('docker-compose', ['up', '-d'], {
    cwd: path.resolve(__dirname, '..'),
  });
};

const getVersion = async () => {
  const { rows } = await knex.raw(`SELECT version()`);
  return rows[0].version;
};

const runMigrations = async () => {
  await execa('npx', ['knex', 'migrate:latest'], {
    cwd: path.resolve(__dirname, '..'),
  });
};

const runSeeds = async () => {
  await execa('npx', ['knex', 'seed:run'], {
    cwd: path.resolve(__dirname, '..'),
  });
};

const waitForDB = async () => {
  await pRetry(getVersion, {
		onFailedAttempt: async error => {
      await delay(error.attemptNumber * 5000);
		},
    retries: 5,
  });
};

const importData = async () => {
  const documents = await fs.readJson(path.resolve(__dirname, '../data/documents.json'));
  for (const doc of documents) {
    await knex('documents').insert({
      id: doc.id,
      category_id: doc.category_id,
      mimetype: doc.mimetype,
      size: doc.size,
      title: doc.title,
      tags: doc.tags,
    });
  }
};

module.exports = {
  killDB,
  startDB,
  waitForDB,
  runMigrations,
  runSeeds,
  removeDBData,
  importData,
  dbIsRunning,
  knex,
};
