'use strict';

const dotty = require('dotty');
const q = require('q');
const _ = require('lodash');

function get(esnConfig, configName, key, callback) {
  if (!callback && typeof key === 'function') {
    callback = key;
    key = null;
  }

  callback = callback || function() {};

  return esnConfig.get(configName)
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
  if (!callback) {
    if (typeof value === 'function') {
      callback = value;
      value = key;
      key = null;
    } else if (typeof value === 'undefined') {
      value = key;
      key = null;
    }
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

function storeMultiple(esnConfig, config, callback) {
  callback = callback || function() {};

  return esnConfig.setMultiple(config)
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
        // try to any possible configuration
        return get(esnConfig, configName).then(function(config) {
          if (!_.isUndefined(config)) {
            return [{
              domainId: null,
              config
            }];
          }

          return [];
        });
      }

      return configs;
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
  get,
  set,
  store,
  storeMultiple,
  getFromAllDomains
};
