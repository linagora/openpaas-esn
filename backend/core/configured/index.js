'use strict';

var configured = false;
var core = require('..');
var pubsub = require('../pubsub').local;

function isConfigured() {
  if (configured) {
    return configured;
  }
  var dbConfig;
  try {
    dbConfig = core.config('db');
  } catch (e) {}

  if (dbConfig && dbConfig.connectionString) {
    configured = true;
    var topic = pubsub.topic('mongodb:configurationAvailable');
    topic.publish(dbConfig);
  }
  return configured;
}

module.exports = isConfigured;
