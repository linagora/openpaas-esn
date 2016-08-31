'use strict';

// DEPRECATED: only be used as fallback for configurations collection

var mongoose = require('mongoose');
var q = require('q');
var EsnConfig = require('../esn-config');
var Features;

try {
  Features = mongoose.model('Features');
} catch (e) {
  Features = require('../../db/mongo/models/features');
}

function findByDomainId(domain_id, callback) {
  Features.findOne({ domain_id: domain_id }).lean().exec(function(err, feature) {
    callback(err, _qualifyFeature(feature));
  });
}

function getAll(callback) {
  Features.find({}).lean().exec(function(err, features) {
    if (!err && Array.isArray(features)) {
      features = features.map(_qualifyFeature);
    }

    callback(err, features);
  });
}

function _qualifyFeature(feature) {
  if (feature && feature.modules) {
    feature.modules.forEach(function(module) {
      if (!module) { return; }

      if (module.name === 'configurations') {
        module.name = 'core';
      }

      if (module.features) {
        module.configurations = module.features;
        delete module.features;
      }
    });
  }

  return feature;
}

function getDomainConfig(moduleName, domainId, configName) {
  if (!domainId) {
    return q.reject(new Error('domainId is required'));
  }

  var esnConfig = new EsnConfig(moduleName, domainId);

  esnConfig.setConfModule({
    findByDomainId: findByDomainId
  });

  return esnConfig.get(configName).then(function(config) {
    if (typeof config === 'undefined') {
      return q.reject(new Error('No configuration found in features collection for: ' + configName));
    }

    return config;
  });
}

function getFromAllDomains(moduleName, configName) {
  var esnConfig = new EsnConfig(moduleName);

  esnConfig.setConfModule({
    getAll: getAll
  });

  return esnConfig.getConfigsFromAllDomains(configName);
}

module.exports = {
  get: getDomainConfig,
  getFromAllDomains: getFromAllDomains,
  findByDomainId: findByDomainId
};
