'use strict';

var Features = require('mongoose').model('Features');

function findFeaturesForDomain(domain_id, callback) {
  Features.findOne({ domain_id: domain_id }, callback);
}

function updateFeatures(feature, callback) {
  feature.save(callback);
}

function getAllFeatures(callback) {
  Features.find({}, callback);
}

module.exports = {
  findFeaturesForDomain: findFeaturesForDomain,
  updateFeatures: updateFeatures,
  getAllFeatures: getAllFeatures
};
