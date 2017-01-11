'use strict';

const HANDLERS = {
  users: indexUsers,
  contacts: indexContacts
};
const q = require('q');
const _ = require('lodash');
const commons = require('../commons');
const request = require('request');
const command = {
  command: 'reindex',
  desc: 'Reindex MongoDB data into Elasticsearch',
  builder: {
    'es-host': {
      describe: 'Elasticsearch host to connect to',
      default: 'localhost'
    },
    'es-port': {
      describe: 'Elasticsearch port to connect to',
      type: 'number',
      default: 9200
    },
    type: {
      alias: 't',
      describe: 'the data type to reindex',
      choices: Object.keys(HANDLERS),
      demand: true
    }
  },
  handler: argv => {
    const { esHost, esPort, type } = argv;

    return exec(esHost, esPort, type)
      .then(null, commons.logError)
      .finally(commons.exit);
  }
};

function exec(esHost, esPort, type) {
  var handler = HANDLERS[type];

  if (!handler) {
    return q.reject('Unknown data type ' + type);
  }
  try {
    return commons.loadMongooseModels().then(function() {
      return handler(esHost, esPort);
    });
  } catch (e) {
    return q.reject(e);
  }
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

function indexContacts(esHost, esPort) {
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

function indexUsers() {
  var db = require('../../fixtures/db'),
      userCoreModule = require('../../backend/core/user'),
      userCoreModuleListener = require('../../backend/core/user/listener'),
      esUtils = require('../../backend/core/elasticsearch/utils');

  return db.connect(commons.getDBOptions())
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

module.exports = {
  exec,
  command
};
