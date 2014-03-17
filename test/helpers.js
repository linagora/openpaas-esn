'use strict';

var mongoose = require('mongoose'),
    async = require('async'),
    MongoClient = require('mongodb').MongoClient;

module.exports = function(mixin, testEnv) {
  mixin.mongo = {
    connect: function(callback) {
      mongoose.connect(testEnv.mongoUrl, callback);
    },
    disconnect: function(callback) {
      mongoose.disconnect(callback);
    },
    dropDatabase: function(callback) {
      MongoClient.connect(testEnv.mongoUrl, function(err, db) {
        db.dropDatabase(function(err) {
          db.close(function() {});
          callback(err);
        });
      });
    },
    dropCollections: function(callback) {
      mongoose.connection.db.collections(function(err, collections) {
        if (err) { return callback(err); }
        collections = collections.filter(function(collection) {
          return collection.collectionName !== 'system.indexes';
        });
        async.forEach(collections, function(collection, done) {
          mongoose.connection.db.dropCollection(collection.collectionName, done);
        }, callback);
      });
    }
  };

};
