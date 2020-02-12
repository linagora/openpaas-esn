'use strict';

// DEPRECATED: only be used as a fallback

const mongoconfig = require('mongoconfig');
const mongoose = require('mongoose');
const q = require('q');

mongoconfig.setDefaultMongoose(mongoose);

function get(configName) {
  return q.ninvoke(mongoconfig(configName), 'get');
}

function findByDomainId() {
  const keys = [
    'mail',
    'session',
    'redis',
    'ldap',
    'davserver',
    'jmap',
    'jwt',
    'oauth',
    'web',
    'user',
    'elasticsearch',
    'login'
  ];

  return q.all(keys.map(function(key) {
    return get(key).then(function(config) {
      if (config) {
        delete config._id;

        return {
          name: key,
          value: config
        };
      }
    });
  })).then(function(configs) {
    var configurations = configs.filter(Boolean);

    if (configurations.length) {
      return {
        modules: [{
          name: 'core',
          configurations: configurations
        }]
      };
    }

    return {};
  });
}

module.exports = {
  findByDomainId
};
