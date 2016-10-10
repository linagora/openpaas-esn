'use strict';

// DEPRECATED: only be used as fallback for configurations collection

const q = require('q');
let Features;
const cacheFeatures = {};

try {
  Features = require('mongoose').model('Features');
} catch (error) {
  Features = require('../../db/mongo/models/features');
}

function findByDomainId(domainId) {
  if (cacheFeatures[domainId]) {
    return q(cacheFeatures[domainId]);
  }

  return Features.findOne({ domain_id: domainId })
    .lean()
    .exec()
    .then(_qualifyFeature)
    .then(function(feature) {
      cacheFeatures[domainId] = feature;

      return feature;
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

  return feature || {};
}

module.exports = {
  findByDomainId
};
