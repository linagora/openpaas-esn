'use strict';

// DEPRECATED: only be used as a fallback

const mongoconfig = require('mongoconfig');
const mongoose = require('mongoose');
const q = require('q');
let cacheConfiguration;

mongoconfig.setDefaultMongoose(mongoose);

function get(configName) {
  return q.ninvoke(mongoconfig(configName), 'get');
}

function findByDomainId() {
  if (cacheConfiguration) {
    return q(cacheConfiguration);
  }

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
    'user'
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

    cacheConfiguration = {};

    if (configurations.length) {
      cacheConfiguration = {
        modules: [{
          name: 'core',
          configurations: configurations
        }]
      };
    }

    return cacheConfiguration;
  });
}

module.exports = {
  findByDomainId
};
