'use strict';

var dotty = require('dotty');
var mongo = require('../../core').db.mongo;
var defaultCollectionName = 'configuration';
var logger = require('../').logger;


function closeConnection(db, callback) {
  return function() {
    var args = arguments;
    db.close(function(err) {
      if (err) {
        logger.warn('MongoDB connection close failed: ', err.message);
      }
      callback.apply(this, args);
    });
  };
}

function EsnConfig(namespace, collectionName) {
  this.namespace = namespace;
  this.collectionName = collectionName;
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
    var collection = db.collection(this.collectionName);
    collection.findOne({_id: this.namespace}, closeConnection(db, sendResponse));
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
    var collection = db.collection(this.collectionName);
    collection.save(cfg, closeConnection(db, callback));
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
    var collection = db.collection(this.collectionName);
    var update = {};
    update[key] = value;
    collection.update({_id: this.namespace}, update, {upsert: true}, closeConnection(db, callback));
  }.bind(this));
};

module.exports = function(namespace, collectionName) {
  if (!namespace) {
    return null;
  }
  return new EsnConfig(namespace, collectionName ? collectionName : defaultCollectionName);
};
