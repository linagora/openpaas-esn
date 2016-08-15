'use strict';

// DEPRECATED: only be used as a fallback

var mongoconfig = require('mongoconfig');
var mongoose = require('mongoose');
var q = require('q');

mongoconfig.setDefaultMongoose(mongoose);

function getMongoConfig(configName) {
  return q.ninvoke(mongoconfig(configName), 'get');
}

module.exports = {
  get: getMongoConfig
};
