'use strict';

var _ = require('lodash');
var features = require('../../core/features');

module.exports.loadFeaturesForUser = function(req, res, next) {
  if (!req.user || !req.user.domains || req.user.domains.length === 0) {
    return next();
  }

  features.findFeaturesForDomain(req.user.preferredDomainId, function(err, features) {
    if (err) {
      return next(err);
    }

    _.remove(features.modules, { name: 'configurations' });
    req.user.features = features;

    next();
  });
};
