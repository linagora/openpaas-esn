'use strict';

var mongoose = require('mongoose'),
    async = require('async');

exports.mongo = {
  connect: function() {
    mongoose.connect('mongodb://localhost:27017/midway-test');
  },
  disconnect: function(callback) {
    mongoose.disconnect(callback);
  },
  dropDatabase: function(callback) {
    mongoose.connection.dropDatabase(callback);
  },
  dropCollections: function(callback) {
    var collections = Object.keys(mongoose.connection.collections);
    async.forEach(collections, function(collection, done) {
      mongoose.connection.collections[collection].drop(done);
    }, callback);
  }
};
