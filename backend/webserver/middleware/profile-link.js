'use strict';

var link = require('../../core/resource-link');
var logger = require('../../core/logger');

module.exports.trackProfileView = function(req, res, next) {

  if (!req.user || !req.params.uuid) {
    return next();
  }

  link.create({
    type: 'profile',
    source: {
      objectType: 'user',
      id: String(req.user._id)
    },
    target: {
      objectType: 'user',
      id: req.params.uuid
    }
  }).catch(function(err) {
    logger.warn('Error while creating profile link', err);
  }).finally(next);
};
