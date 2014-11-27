'use strict';

var mongoose = require('mongoose');

var collaborationModels = {
  community: 'Community'
};

function query(objectType, q, callback) {
  var modelName = collaborationModels[objectType];
  if (!modelName) {
    return callback(new Error('Collaboration model ' + objectType + ' is unknown'));
  }
  q = q || {};
  var Model = mongoose.model(modelName);
  return Model.find(q, callback);
}

function registerCollaborationModel(name, modelName, schema) {
  if (collaborationModels[name]) {
    throw new Error('Collaboration model ' + name + 'is already registered');
  }
  var model = mongoose.model(modelName, schema);
  collaborationModels[name] = modelName;
  return model;
}

module.exports.query = query;
module.exports.schemaBuilder = require('../db/mongo/models/base-collaboration');
module.exports.registerCollaborationModel = registerCollaborationModel;
