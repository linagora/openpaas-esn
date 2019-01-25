const HANDLERS = {
  users: reindexUsers,
  contacts: reindexContacts,
  'core.events': reindexCoreEvents
};
const q = require('q');
const commons = require('../commons');
const db = require('../../fixtures/db');
const coreElasticsearch = require('../../backend/core/elasticsearch');
const command = {
  command: 'reindex',
  desc: 'Reindex MongoDB data into Elasticsearch',
  builder: {
    type: {
      alias: 't',
      describe: 'the data type to reindex',
      choices: Object.keys(HANDLERS),
      demand: true
    }
  },
  handler: argv => {
    const { type } = argv;

    return exec(type)
      .then(null, commons.logError)
      .finally(commons.exit);
  }
};

function exec(type) {
  const handler = HANDLERS[type];

  if (!handler) {
    return q.reject('Unknown data type ' + type);
  }
  try {
    return commons.loadMongooseModels()
      .then(() => handler());
  } catch (e) {
    return q.reject(e);
  }
}

function reindexContacts() {
  commons.logInfo('Starting reindexing of contacts');
  const deps = {
    'technical-user': require('../../backend/core/technical-user'),
    domain: require('../../backend/core/domain'),
    'esn-config': require('../../backend/core/esn-config'),
    elasticsearch: coreElasticsearch
  };
  const dependencies = name => deps[name];

  deps.davserver = {
    utils: require('../../modules/linagora.esn.davserver/backend/lib/utils')(dependencies)
  };

  const { buildReindexOptions } = require('../../modules/linagora.esn.contact/backend/lib/search/reindex')(dependencies);

  return db.connect(commons.getDBOptions())
    .then(() => buildReindexOptions())
    .then(options => coreElasticsearch.reindex(options))
    .then(() => commons.logInfo('Reindexing of contacts done'))
    .finally(db.disconnect);
}

function reindexUsers() {
  const userCoreModule = require('../../backend/core/user');
  const userCoreModuleListener = require('../../backend/core/user/listener');
  const options = userCoreModuleListener.getOptions();
  const cursor = userCoreModule.listByCursor();

  commons.logInfo('Starting reindexing of users');

  options.next = function() {
    return cursor.next();
  };
  options.name = 'users.idx';

  return db.connect(commons.getDBOptions())
    .then(() => coreElasticsearch.reindex(options))
    .finally(db.disconnect);
}

function reindexCoreEvents() {
  commons.logInfo('Starting reindexing of core events');

  return db.connect(commons.getDBOptions())
    .then(() => coreElasticsearch.reconfig('core.events.idx', 'core.events')
    .then(() => { commons.logInfo('Reindexing of core events done'); }))
    .finally(db.disconnect);
}

module.exports = {
  exec,
  command
};
