'use strict';

var _ = require('lodash');
var configuration = require('../configuration');

function findFeaturesForDomain(domainId, callback) {
  configuration.findByDomainId(domainId, function(err, config) {
    if (err) {
      return callback(err);
    }

    if (config && config.modules) {
      _.remove(config.modules, { name: 'core' });
    }

    callback(err, config);
  });
}

module.exports = {
  findFeaturesForDomain: findFeaturesForDomain
};
