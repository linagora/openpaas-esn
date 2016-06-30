'use strict';

var HANDLERS = { users: indexUsers };

var q = require('q'),
    _ = require('lodash'),
    commons = require('../commons'),
    db = require('../../fixtures/db'),
    esUtils = require('../../backend/core/elasticsearch/utils');

function exec(dbHost, dbPort, dbName, type) {
  var handler = HANDLERS[type];

  if (!handler) {
    return q.reject('Unknown data type ' + type);
  }

  return db.connect(commons.getDBOptions(dbHost, dbPort, dbName))
    .then(handler)
    .finally(function() {
      db.disconnect();
    });
}

function indexUsers() {
  return q.nfcall(require('../../backend/core/user').list).then(function(users) {
    if (!users || users.length === 0) {
      return commons.logInfo('No users found in database');
    }

    var options = require('../../backend/core/user/listener').getOptions();

    commons.logInfo('Starting indexing of ' + users.length + ' user(s) to ES');

    return q.all(users.map(function(user) {
      return q.nfcall(esUtils.indexData, _.assign({}, options, { data: user })).then(function() {
        commons.logInfo('Successfully indexed user ' + user._id.toString());
      }, commons.logError);
    })).then(function() {
      commons.logInfo('Done indexing ' + users.length + ' users');
    });
  });
}

module.exports.createCommand = function(command) {
  command
    .description('Reindex MongoDB data into Elasticsearch')
    .option('--db-host <host>', 'MongoDB host to connect to')
    .option('--db-port <port>', 'MongoDB port to connect to')
    .option('--db-name <name>', 'MongoDB host to connect to')
    .option('-t, --type <type>', 'the data type to reindex')
    .action(function(cmd) {
      return exec(cmd.dbHost, cmd.dbPort, cmd.dbName, cmd.type)
        .then(null, commons.logError)
        .finally(commons.exit);
    });
};
