'use strict';

var HANDLERS = {
  users: indexUsers,
  contacts: indexContacts
};

var q = require('q'),
    _ = require('lodash'),
    commons = require('../commons'),
    request = require('request');

function exec(dbHost, dbPort, dbName, esHost, esPort, type) {
  var handler = HANDLERS[type];

  if (!handler) {
    return q.reject('Unknown data type ' + type);
  }

  return handler(dbHost, dbPort, dbName, esHost, esPort);
}

function queryElasticsearch(method, url, data) {
  return q.Promise(function(resolve, reject) {
    request({
      method: method,
      url: url,
      json: true,
      body: data
    }, function(err, response, body) {
      if (err) {
        return reject(err);
      }

      if (response.statusCode !== 200) {
        return reject(new Error('Got ' + response.statusCode + ' from Elasticsearch with response ' + JSON.stringify(body)));
      }

      resolve(body);
    });
  });
}

function createIndex(indexUrl, configuration) {
  commons.logInfo('Creating index at ' + indexUrl);

  return queryElasticsearch('POST', indexUrl, configuration);
}

function deleteIndex(indexUrl) {
  commons.logInfo('Deleting index at ' + indexUrl);

  return queryElasticsearch('DELETE', indexUrl);
}

function reindexContacts(reindexUrl, sourceIndex, destinationIndex) {
  commons.logInfo('Reindexing contacts from ' + sourceIndex + ' to ' + destinationIndex + ' using ' + reindexUrl);

  return queryElasticsearch('POST', reindexUrl, {
    source: {
      index: sourceIndex
    },
    dest: {
      index: destinationIndex
    }
  });
}

function indexContacts(dbHost, dbPort, dbName, esHost, esPort) {
  var esConfiguration = commons.getESConfiguration(esHost, esPort),
      contactsIndexUrl = esConfiguration.getIndexUrl('contacts'),
      contactsTmpIndexUrl = esConfiguration.getIndexUrl('contacts_tmp'),
      reindexEndpointUrl = 'http://' + esConfiguration.options.host + ':' + esConfiguration.options.port + '/_reindex?refresh=true';

  commons.logInfo('Starting reindexing of contacts');

  return esConfiguration.getIndexConfiguration('contacts')
    .then(function(configuration) {
      return createIndex(contactsTmpIndexUrl, configuration)
        .then(reindexContacts.bind(null, reindexEndpointUrl, 'contacts.idx', 'contacts_tmp.idx'))
        .then(deleteIndex.bind(null, contactsIndexUrl))
        .then(createIndex.bind(null, contactsIndexUrl, configuration))
        .then(reindexContacts.bind(null, reindexEndpointUrl, 'contacts_tmp.idx', 'contacts.idx'))
        .then(deleteIndex.bind(null, contactsTmpIndexUrl));
    })
    .then(function() {
      commons.logInfo('Reindexing of contacts done');
    });
}

function indexUsers(dbHost, dbPort, dbName) {
  var db = require('../../fixtures/db'),
      userCoreModule = require('../../backend/core/user'),
      userCoreModuleListener = require('../../backend/core/user/listener'),
      esUtils = require('../../backend/core/elasticsearch/utils');

  return db.connect(commons.getDBOptions(dbHost, dbPort, dbName))
    .then(function() {
      return q.nfcall(userCoreModule.list).then(function(users) {
        if (!users || users.length === 0) {
          return commons.logInfo('No users found in database');
        }

        var options = userCoreModuleListener.getOptions();

        commons.logInfo('Starting indexing of ' + users.length + ' user(s) to ES');

        return q.all(users.map(function(user) {
          return q.nfcall(esUtils.indexData, _.assign({}, options, { data: user })).then(function() {
            commons.logInfo('Successfully indexed user ' + user._id.toString());
          }, commons.logError);
        })).then(function() {
          commons.logInfo('Done indexing ' + users.length + ' users');
        });
      });
    })
    .finally(function() {
      db.disconnect();
    });
}

module.exports.createCommand = function(command) {
  command
    .description('Reindex MongoDB data into Elasticsearch')
    .option('--db-host <host>', 'MongoDB host to connect to')
    .option('--db-port <port>', 'MongoDB port to connect to')
    .option('--db-name <name>', 'MongoDB host to connect to')
    .option('--es-host <host>', 'Elasticsearch host to connect to')
    .option('--es-port <port>', 'Elasticsearch port to connect to')
    .option('-t, --type <type>', 'the data type to reindex')
    .action(function(cmd) {
      return exec(cmd.dbHost, cmd.dbPort, cmd.dbName, cmd.esHost, cmd.esPort, cmd.type)
        .then(null, commons.logError)
        .finally(commons.exit);
    });
};
