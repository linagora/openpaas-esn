'use strict';

// DEPRECATED: only be used as fallback for configurations collection

let Features;

try {
  Features = require('mongoose').model('Features');
} catch (error) {
  Features = require('../../db/mongo/models/features');
}

function findByDomainId(domainId) {
  return Features.findOne({ domain_id: domainId })
    .lean()
    .exec()
    .then(_qualifyFeature);
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
