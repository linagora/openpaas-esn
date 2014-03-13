'use strict';

var mongoose = require('mongoose'),
    async = require('async');
var testConfig = require('./config/servers-conf.js');

exports.mongo = {
  connect: function(callback) {
    mongoose.connect('mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname, callback);
  },
  disconnect: function(callback) {
    mongoose.disconnect(callback);
  },
  dropDatabase: function(callback) {
    mongoose.connection.dropDatabase(callback);
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
