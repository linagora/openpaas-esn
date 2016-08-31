'use strict';

var dotty = require('dotty');
var q = require('q');
var EsnConfig = require('./esn-config');
var constants = require('./constants');
var deprecatedApi = require('./deprecated');

function _getDomainWideConfig(esnConfig, configName) {
  if (esnConfig.domainId === constants.DEFAULT_DOMAIN_ID) {
    return q.reject(new Error('domainId should be set'));
  }

  return esnConfig.get(configName)
    .then(function(config) {
      if (typeof config === 'undefined') {
        return q.reject(new Error('No domain-wide configuration found for: ' + configName));
      }

      return config;
    })
    .catch(function() {
      return deprecatedApi.features.get(esnConfig.moduleName, esnConfig.domainId, configName);
    });
}

function _getSystemWideConfig(moduleName, configName) {
  var esnConfig = new EsnConfig(moduleName, constants.DEFAULT_DOMAIN_ID);

  return esnConfig.get(configName)
    .then(function(config) {
      if (typeof config === 'undefined') {
        return q.reject(new Error('No system-wide configuration found for: ' + configName));
      }

      return config;
    })
    .catch(function() {
      return deprecatedApi.mongoconfig.get(configName);
    });
}

function get(esnConfig, configName, key, callback) {
  if (!callback && typeof key === 'function') {
    callback = key;
    key = null;
  }

  callback = callback || function() {};

  return _getDomainWideConfig(esnConfig, configName)
    .catch(function() {
      return _getSystemWideConfig(esnConfig.moduleName, configName);
    })
    .then(function(config) {
      if (key) {
        config = dotty.get(config, key);
      }

      callback(null, config);

      return config;
    })
    .catch(function(err) {
      callback(err);

      return q.reject(err);
    });
}

function set(esnConfig, configName, key, value, callback) {
  if (!callback && typeof value === 'function') {
    callback = value;
    value = key;
    key = null;
  }

  callback = callback || function() {};

  return esnConfig.set({
    name: configName,
    key: key,
    value: value
  })
  .then(function(data) {
    callback(null, data);

    return data;
  })
  .catch(function(err) {
    callback(err);

    return q.reject(err);
  });
}

function store(esnConfig, configName, value, callback) {
  callback = callback || function() {};

  return esnConfig.set({
    name: configName,
    value: value
  })
  .then(function(data) {
    callback(null, data);

    return data;
  })
  .catch(function(err) {
    callback(err);

    return q.reject(err);
  });
}

function getFromAllDomains(esnConfig, configName, callback) {
  callback = callback || function() {};

  return esnConfig.getConfigsFromAllDomains(configName)
    .then(function(configs) {
      if (!configs || !configs.length) {
        return q.reject();
      }

      return configs;
    })
    .catch(function() {
      return deprecatedApi.features.getFromAllDomains(esnConfig.moduleName, configName);
    })
    .then(function(configs) {
      callback(null, configs);

      return configs;
    })
    .catch(function(err) {
      callback(err);

      return q.reject(err);
    });
}

module.exports = {
  get: get,
  set: set,
  store: store,
  getFromAllDomains: getFromAllDomains
};
