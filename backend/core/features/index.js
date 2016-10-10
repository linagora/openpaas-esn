'use strict';

var _ = require('lodash');
var configFallback = require('../esn-config/fallback');

function findFeaturesForDomain(domainId, callback) {
  configFallback.findByDomainId(domainId).then(function(config) {
    if (config && config.modules) {
      _.remove(config.modules, { name: 'core' });
    }

    return callback(null, config);
  }, callback);
}

module.exports = {
  findFeaturesForDomain: findFeaturesForDomain
};
