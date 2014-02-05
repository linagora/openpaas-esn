'use strict';

var dotty = require('dotty');
var mongo = require('../../core').db.mongo;
var collectionName = 'configuration';


function EsnConfig(namespace) {
  this.namespace = namespace;
}

EsnConfig.prototype.get = function(key, callback) {
  if (!callback) {
    callback = key;
    key = null;
  }

  function sendResponse(err, doc) {
    if (err) {
      return callback(err);
    } else if (!key) {
      return callback(null, doc);
    } else {
      return callback(null, dotty.get(doc, key));
    }
  }

  mongo.client(function(err, db) {
    if (err) {
      return callback(err);
    }
    var collection = db.collection(collectionName);
    collection.findOne({_id: this.namespace}, sendResponse);
  }.bind(this));
};

EsnConfig.prototype.store = function(cfg, callback) {
  if (!cfg) {
    return callback(new Error('configuration object must be set'));
  }
  if (typeof cfg !== 'object') {
    return callback(new Error('configuration object must be an object'));
  }

  cfg._id = this.namespace;
  mongo.client(function(err, db) {
    if (err) {
      return callback(err);
    }
    var collection = db.collection(collectionName);
    collection.save(cfg, callback);
  }.bind(this));
};

EsnConfig.prototype.set = function(key, value, callback) {
  if (!key) {
    return callback(new Error('configuration key must be set'));
  }
  if (typeof key !== 'string') {
    return callback(new Error('configuration key must be a string'));
  }
  mongo.client(function(err, db) {
    if (err) {
      return callback(err);
    }
    var collection = db.collection(collectionName);
    var update = {};
    update[key] = value;
    collection.update({_id: this.namespace}, update, {upsert: true}, callback);
  }.bind(this));
};

module.exports = function(namespace) {
  if (!namespace) {
    return null;
  }
  return new EsnConfig(namespace);
};
