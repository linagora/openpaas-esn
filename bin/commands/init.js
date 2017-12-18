'use strict';

const commons = require('../commons');
const CONSTANTS = require('../constants').params;
const elasticsearch = require('./elasticsearch');
const generateJWT = require('./generateJWT');
const configure = require('../../fixtures/esn-config');
const populate = require('../../fixtures/populate');
const db = require('../../fixtures/db');

const command = {
  command: 'init',
  desc: 'Performs the initial setup of an OpenPaas instance',
  builder: {
    email: CONSTANTS.administrator.email,
    password: CONSTANTS.administrator.password
  },
  handler: argv => {
    const { email, password } = argv;

    return commons.runCommand('init', () => exec(email, password));
  }
};

function exec(email, password) {
  return elasticsearch.exec()
    .then(db.connect.bind(null, commons.getDBOptions()))
    .then(configure)
    .then(generateJWT.exec(CONSTANTS.params.jwt.path.default))
    .then(() => populate.provisionDomainAndAdministrator(email, password))
    .then(db.disconnect);
}

module.exports = {
  exec,
  command
};
