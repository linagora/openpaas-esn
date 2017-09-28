'use strict';

const q = require('q');
const commons = require('../commons');
const EsConfig = require('esn-elasticsearch-configuration');
const AVAILABLE_INDEX_TYPES = ['users', 'contacts', 'events'];
const command = {
  command: 'elasticsearch',
  desc: 'Configure ElasticSearch',
  builder: {
    host: {
      alias: 'h',
      describe: 'elasticsearch host to connect to',
      default: 'localhost'
    },
    port: {
      alias: 'p',
      describe: 'elasticsearch port to connect to',
      type: 'number',
      default: 9200
    },
    type: {
      alias: 't',
      describe: 'index type'
    },
    index: {
      alias: 'i',
      describe: 'index to create'
    }
  },
  handler: argv => {
    const { host, port, type, index } = argv;

    exec(host, port, type, index)
      .then(() => commons.logInfo('ElasticSearch has been configured'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, type, index) {
  host = host || process.env.ELASTICSEARCH_HOST || 'localhost';
  port = port || +process.env.ELASTICSEARCH_PORT || 9200;

  const esConfig = new EsConfig({host: host, port: port});

  if (type) {
    index = index || _getDefaultIndex(type);

    return esConfig.setup(index, type);
  }

  return q.all(AVAILABLE_INDEX_TYPES
    .map(type => esConfig.setup(_getDefaultIndex(type), type))
  );
}

function _getDefaultIndex(type) {
  return `${type}.idx`;
}

module.exports = {
  exec,
  command
};
