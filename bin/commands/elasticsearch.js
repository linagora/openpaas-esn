'use strict';

const q = require('q');
const commons = require('../commons');
const EsnConfig = require('esn-elasticsearch-configuration');
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
      describe: 'index to create',
      choices: AVAILABLE_INDEXS
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

  var esnConf = new EsnConfig({host: host, port: port});

  if (index) {
    return esnConf.createIndex(index);
  }

  return q.all(AVAILABLE_INDEXS.map(function(index) {
    return esnConf.createIndex(index);
  }));
}

module.exports = {
  exec,
  command
};
