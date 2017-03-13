'use strict';

var mongoose = require('mongoose');
var Configuration;

try {
  Configuration = mongoose.model('Configuration');
} catch (e) {
  Configuration = require('../db/mongo/models/configuration');
}

function findConfigurationForDomain(domainId, callback) {
  Configuration.findOne({ domain_id: domainId, user_id: { $exists: false } }, callback);
}

function findConfigurationForUser(domainId, userId, callback) {
  Configuration.findOne({ domain_id: domainId, user_id: userId }, callback);
}

function findConfiguration(domainId, userId, callback) {
  if (!callback && typeof userId === 'function') {
    callback = userId;
    userId = null;
  }

  if (userId) {
    findConfigurationForUser(domainId, userId, callback);
  } else {
    findConfigurationForDomain(domainId, callback);
  }
}

function update(configuration, callback) {
  if (!configuration) {
    return callback(new Error('configuration cannot be null'));
  }

  var configurationAsModel = configuration instanceof Configuration ? configuration : new Configuration(configuration);

  configurationAsModel.save(callback);
}

function getAll(callback) {
  Configuration.find({}, callback);
}

module.exports = {
  findConfiguration: findConfiguration,
  update: update,
  getAll: getAll
};
