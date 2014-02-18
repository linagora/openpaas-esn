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
    var collections = Object.keys(mongoose.connection.collections);
    async.forEach(collections, function(collection, done) {
      mongoose.connection.collections[collection].drop(done);
    }, callback);
  }
};
