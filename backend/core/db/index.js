'use strict';

var dbModule = {
  mongo: require('./mongo'),
  redis: require('./redis')
};

module.exports = dbModule;
