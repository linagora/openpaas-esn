'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schemaCache = {
};
var schemaSuffix = 1;

function buildSchema(name) {
  var EsnConfigSchema = new Schema({_id: String}, {
    strict: false,
    collection: name
  });
  var schemaName = 'EsnConfig' + schemaSuffix;
  schemaSuffix++;
  schemaCache[name] = mongoose.model(schemaName, EsnConfigSchema);
}

module.exports = function(name) {
  if (! (name in schemaCache)) {
    buildSchema(name);
  }
  return schemaCache[name];
};
