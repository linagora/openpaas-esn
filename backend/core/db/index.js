'use strict';

var pubsub = require('..').pubsub.local;
var configured = require('../configured');
var core = require('..');

var dbModule = {
  mongo: require('./mongo')
};

module.exports = dbModule;
