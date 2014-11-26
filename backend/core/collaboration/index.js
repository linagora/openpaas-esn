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

module.exports.query = query;
