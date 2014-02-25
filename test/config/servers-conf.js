'use strict';

module.exports = {
  mongodb: {
    'cmd' : process.env.CMD_MONGODB || 'mongod',
    'port' : process.env.PORT_MONGODB || 23456,
    'dbname': 'tests',
    'dbpath' : 'tmp/mongo/',
    'logpath' : ''
  },

  redis: {
    'cmd' : process.env.CMD_REDIS || 'redis-server',
    'port' : process.env.PORT_REDIS || 23457,
    'conf_file' : '',
    'log_path' : '',
    'pwd' : ''
  },

  ldap: {
    'cmd': 'node ./test/inmemory-ldap.js',
    'port': process.env.PORT_LDAP || 23458,
    'suffix': 'o=rse',
    'ldapadmin': 'cn=root',
    'pwd': 'secret'
  }
};
