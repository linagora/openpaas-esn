'use strict';

var mongoose = require('mongoose');
var Tuple = require('./tuple').Tuple;
var validateTuple = require('./tuple').validateTuple;

var Injection = new mongoose.Schema({
  source: {type: Tuple.tree, required: true},
  key: {type: String, required: true},
  values: [
    {
      directive: {type: String, required: true},
      attributes:
        [{
          name: {type: String, required: true},
          value: {type: String, required: true}
        }]
    }
  ]
}, {_id: false});
module.exports.Injection = Injection;

function validateInjection(value) {
  if (!value.key) { return false; }
  if (typeof value.key !== 'string') { return false; }
  if (value.values && !(value.values instanceof Array)) { return false; }
  if (!value.source) { return false; }
  if (!validateTuple(value.source)) { return false; }

  if (value.values) {

    for (var i = 0; i < value.values.length; i++) {
      var injectionValue = value.values[i];
      if (!injectionValue.directive) { return false; }
      if (typeof value.key !== 'string') { return false; }
      if (injectionValue.attributes && !(injectionValue.attributes instanceof Array)) { return false; }

      for (var j = 0; j < injectionValue.attributes.length; j++) {
        var directiveAttribute = injectionValue.attributes[j];
        if (!directiveAttribute.name) { return false; }
        if (typeof directiveAttribute.name !== 'string') { return false; }
        if (!directiveAttribute.value) { return false; }
        if (typeof directiveAttribute.value !== 'string') { return false; }
      }

    }

  }
  return true;
}
module.exports.validateInjection = validateInjection;

function validateInjections(value) {
  if (!value) { return true; }
  for (var i = 0, len = value.length; i < len; i++) {
    if (!validateInjection(value[i])) {
      return false;
    }
  }
  return true;
}
module.exports.validateInjections = validateInjections;
