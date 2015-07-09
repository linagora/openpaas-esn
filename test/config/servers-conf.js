'use strict';

var tmp = 'tmp';

module.exports = {
  tmp: tmp,

  express: {
    'port' : process.env.PORT_EXPRESS || 23455
  },

  mongodb: {
    'cmd' : process.env.CMD_MONGODB || 'mongod',
    'port' : process.env.PORT_MONGODB || 23456,
    'interval_replica_set': process.env.MONGODB_INTERVAL_REPLICA_SET || 1000,
    'tries_replica_set': process.env.MONGODB_TRIES_REPLICA_SET || 20,
    'replicat_set_name' : 'rs',
    'dbname': 'tests',
    'dbpath' : tmp + '/mongo/',
    'logpath' : '',
    'elasticsearch': {
      'rivers': ['users', 'domains', 'messages', 'communities']
    },
    'container': {
      'image': 'mongo:2.6.6',
      'name': 'mongo_for_esn_test'
    }
  },

  redis: {
    'cmd' : process.env.CMD_REDIS || 'redis-server',
    'port' : process.env.PORT_REDIS || 23457,
    'conf_file' : '',
    'log_path' : '',
    'pwd' : '',
    'container': {
      'image': 'redis:latest',
      'name': 'redis_for_esn_test'
    }
  },

  ldap: {
    'cmd': 'node ./test/inmemory-ldap.js',
    'port': process.env.PORT_LDAP || 23458,
    'suffix': 'o=rse',
    'ldapadmin': 'cn=root',
    'pwd': 'secret'
  },

  elasticsearch: {
    'cmd': process.env.CMD_ELASTICSEARCH || 'elasticsearch',
    'port': process.env.PORT_ELASTICSEARCH || 23459,
    'communication_port': process.env.COMMUNICATION_PORT_ELASTICSEARCH || 23460,
    'interval_index': process.env.ELASTICSEARCH_INTERVAL_INDEX || 1000,
    'tries_index': process.env.ELASTICSEARCH_TRIES_INDEX || 20,
    'cluster_name': 'elasticsearch',
    'data_path': tmp + '/elasticsearch/data',
    'work_path': tmp + '/elasticsearch/work',
    'logs_path': tmp + '/elasticsearch/logs',
    'container': {
      'image': 'linagora/esn-elasticsearch:latest',
      'name': 'elasticsearch_for_esn_test'
    }
  }
};
