'use strict';

var _ = require('lodash');
var configuration = require('../configuration');
var features = require('../esn-config/deprecated').features;

function _fallbackToFeatures(domainId, callback) {
  features.findByDomainId(domainId, function(err, config) {
    if (config && config.modules) {
      _.remove(config.modules, { name: 'core' });
    }

    callback(err, config);
  });
}

function findFeaturesForDomain(domainId, callback) {
  configuration.findByDomainId(domainId, function(err, config) {
    if (err) {
      return _fallbackToFeatures(domainId, callback);
    }

    if (config && config.modules) {
      _.remove(config.modules, { name: 'core' });

      return callback(err, config);
    }

    return _fallbackToFeatures(domainId, callback);
  });
}

module.exports = {
  findFeaturesForDomain: findFeaturesForDomain
};
