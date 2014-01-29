'use strict';

var configured = false;
var core = require('..');

function isConfigured() {
  if (configured) {
    return configured;
  }
  var dbConfig;
  try {
    dbConfig = core.config('db');
  } catch (e) {}

  if (dbConfig && dbConfig.port) {
    configured = true;
  }
  return configured;
}

module.exports = isConfigured;
