'use strict';

var Features = require('mongoose').model('Features');

module.exports.findFeaturesForDomain = function(domain_id, callback) {
  Features.findOne({ domain_id: domain_id }, callback);
};
