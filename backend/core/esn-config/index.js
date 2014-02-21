'use strict';

var dotty = require('dotty');
var defaultCollectionName = 'configuration';
var builder = require('./schema-builder');
var mongoose = require('mongoose');


function EsnConfig(namespace, collectionName) {
  this.namespace = namespace;
  this.collectionName = collectionName;
  this.schema = builder(collectionName);
}

EsnConfig.prototype.get = function(key, callback) {
  if (!callback) {
    callback = key;
    key = null;
  }

  function sendResponse(err, doc) {
    if (err) {
      return callback(err);
    } else if (!doc) {
      return callback(null, null);
    } else if (!key) {
      return callback(null, doc.toObject());
    } else {
      return callback(null, dotty.get(doc.toObject(), key));
    }
  }

  this.schema.findOne({_id: this.namespace}, sendResponse);
};

EsnConfig.prototype.store = function(cfg, callback) {
  if (!cfg) {
    return callback(new Error('configuration object must be set'));
  }
  if (typeof cfg !== 'object') {
    return callback(new Error('configuration object must be an object'));
  }
  cfg._id = this.namespace;
  mongoose.connection.collections[this.collectionName].save(cfg, callback);
};

EsnConfig.prototype.set = function(key, value, callback) {
  if (!key) {
    return callback(new Error('configuration key must be set'));
  }
  if (typeof key !== 'string') {
    return callback(new Error('configuration key must be a string'));
  }
  var update = {};
  update[key] = value;
  this.schema.findByIdAndUpdate(this.namespace, update, callback);
};

module.exports = function(namespace, collectionName) {
  if (!namespace) {
    return null;
  }
  return new EsnConfig(namespace, collectionName ? collectionName : defaultCollectionName);
};
