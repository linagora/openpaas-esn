'use strict';

var mongoose = require('mongoose');
var Configuration;

try {
  Configuration = mongoose.model('Configuration');
} catch (e) {
  Configuration = require('../db/mongo/models/configuration');
}

function findByDomainId(domain_id, callback) {
  Configuration.findOne({ domain_id: domain_id }, callback);
}

function update(configuration, callback) {
  if (!configuration) {
    return callback(new Error('configuration cannot be null'));
  }

  configuration.save(callback);
}

function getAll(callback) {
  Configuration.find({}, callback);
}

module.exports = {
  findByDomainId: findByDomainId,
  update: update,
  getAll: getAll
};
