'use strict';

var Q = require('q');
var pubsub = require('..').pubsub.local;
var configured = require('../configured');
var core = require('..');

var dbModule = {
  mongo: require('./mongo')
};

var mongoConfigDeferred = Q.defer();

if (configured()) {
  mongoConfigDeferred.resolve(core.config('db'));
}
else {
  pubsub.topic('mongodb:configurationAvailable').subscribe(function(config) {
    mongoConfigDeferred.resolve(config);
  });
}

dbModule.mongoAvailable = mongoConfigDeferred.promise;

module.exports = dbModule;
