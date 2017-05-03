'use strict';

const q = require('q');
const commons = require('../commons');
const EsConfig = require('esn-elasticsearch-configuration');
const AVAILABLE_INDEXS = ['users', 'contacts', 'events'];
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
    index: {
      alias: 'i',
      describe: 'index to create'
    }
  },
  handler: argv => {
    const { host, port, index } = argv;

    exec(host, port, index)
      .then(() => commons.logInfo('ElasticSearch has been configured'))
      .catch(commons.logError)
      .finally(commons.exit);
  }
};

function exec(host, port, index) {
  host = host || process.env.ELASTICSEARCH_HOST || 'localhost';
  port = port || +process.env.ELASTICSEARCH_PORT || 9200;

  const esConfig = new EsConfig({host: host, port: port});

  if (index) {
    return esConfig.createIndex(index);
  }

  return q.all(AVAILABLE_INDEXS.map(function(index) {
    return esConfig.createIndex(index);
  }));
}

module.exports = {
  exec,
  command
};
