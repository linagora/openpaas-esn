'use strict';

var Q = require('q');
var pubsub = require('..').pubsub.local;

var dbModule = {
  mongo: require('./mongo')
};

var mongoConfigDeferred = Q.defer();

pubsub.topic('mongodb:configurationAvailable').subscribe(function(config) {
  mongoConfigDeferred.resolve(config);
});

dbModule.mongoAvailable = mongoConfigDeferred.promise;

module.exports = dbModule;
