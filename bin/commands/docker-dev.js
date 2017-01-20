'use strict';

const commons = require('../commons');
const CONSTANTS = require('../constants').params;
const populateFixture = require('../../fixtures/populate');
const configFixture = require('../../fixtures/esn-config');
const db = require('../../fixtures/db');
const command = {
  command: 'docker-dev',
  desc: 'Dev Setup for Docker Compose',
  builder: {
    host: CONSTANTS.mongodb.host,
    port: CONSTANTS.mongodb.port,
    database: CONSTANTS.mongodb.database
  },
  handler: argv => {
    const { host, port, database } = argv;

    exec(host, port, database)
      .then(() => commons.logInfo('Docker data initialized!'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, dbName) {
  host = host || 'localhost';
  process.env.MONGO_HOST = host;
  process.env.REDIS_HOST = host;
  process.env.AMQP_HOST = host;
  process.env.ELASTICSEARCH_HOST = host;
  process.env.DAV_SERVER_HOST = host;
  process.env.DAV_SERVER_PORT = 8001;
  process.env.WEB_HOST = 'localhost';
  process.env.MAIL_BROWSER = false;
  process.env.SMTP_HOST = host;
  process.env.SMTP_PORT = 1025;

  return db.connect(commons.getDBOptions(host, port, dbName))
    .then(configFixture)
    .then(() => populateFixture.populateAll(host))
    .then(db.disconnect);
}

module.exports = {
  exec,
  command
};
