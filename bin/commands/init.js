'use strict';

const commons = require('../commons'),
      elasticsearch = require('./elasticsearch'),
      configure = require('../../fixtures/esn-config'),
      populate = require('../../fixtures/populate'),
      db = require('../../fixtures/db');

function exec(commander, email) {
  if (!email) {
    return commander.help();
  }

  return elasticsearch.exec()
    .then(db.connect.bind(null, commons.getDBOptions()))
    .then(configure)
    .then(() => populate.provisionDomainAndAdministrator(email))
    .then(db.disconnect);
}

function createCommand(command) {
  command
    .description('Performs the initial setup of an OpenPaas instance')
    .option('-e, --email <email-address>', 'Email address of the administrator to create')
    .action(function(cmd) {
      return commons.runCommand('init', () => exec(command, cmd.email));
    });
}

module.exports = {
  createCommand
};
