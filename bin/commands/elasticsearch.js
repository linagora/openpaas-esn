const commons = require('../commons');
const EsConfig = require('esn-elasticsearch-configuration');

const AVAILABLE_INDEX_TYPES = [
  'core.events',
  'chat.conversations',
  'chat.messages',
  'contacts',
  'events',
  'groups',
  'resources',
  'users'
];
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 9200;

module.exports = {
  command: {
    command: 'elasticsearch',
    desc: 'Configure ElasticSearch',
    builder: {
      host: {
        alias: 'h',
        describe: 'elasticsearch host to connect to',
        default: DEFAULT_HOST
      },
      port: {
        alias: 'p',
        describe: 'elasticsearch port to connect to',
        type: 'number',
        default: DEFAULT_PORT
      },
      type: {
        alias: 't',
        describe: 'index type',
        choices: AVAILABLE_INDEX_TYPES
      },
      index: {
        alias: 'i',
        describe: 'index to create'
      }
    },
    handler: argv => {
      const { host, port, type, index } = argv;

      exec({ host, port, type, index })
        .then(() => commons.logInfo('ElasticSearch has been configured'))
        .catch(commons.logError)
        .finally(commons.exit);
    }
  }
};

function exec({ host, port, type, index } = {}) {
  host = host || process.env.ELASTICSEARCH_HOST || DEFAULT_HOST;
  port = port || +process.env.ELASTICSEARCH_PORT || DEFAULT_PORT;

  const esConfig = new EsConfig({host: host, port: port});

  if (type) {
    index = index || _getDefaultIndex(type);

    return esConfig.setup(index, type);
  }

  return Promise.all(AVAILABLE_INDEX_TYPES.map(type => esConfig.setup(_getDefaultIndex(type), type)));
}

function _getDefaultIndex(type) {
  return `${type}.idx`;
}
