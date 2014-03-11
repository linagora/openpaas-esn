'use strict';

var configured = false;
var core = require('..');
var pubsub = require('..').pubsub.local;

function isConfigured() {
  if (configured) {
    return configured;
  }
  var dbConfig;
  try {
    var topic = pubsub.topic('mongodb:configurationAvailable');
    dbConfig = core.config('db');
    topic.publish(dbConfig);
  } catch (e) {}

  if (dbConfig && dbConfig.connectionString) {
    configured = true;
  }
  return configured;
}

module.exports = isConfigured;
