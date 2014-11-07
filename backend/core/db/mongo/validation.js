'use strict';

var ICON_OBJECT_TYPE = require('./common').ICON_OBJECT_TYPE;
var TARGET_OBJECT_TYPE = require('./common').TARGET_OBJECT_TYPE;

function validateTuple(tuple) {
  if (!tuple) { return true; }
  if (! ('objectType' in tuple)) { return false; }
  if (! ('id' in tuple)) { return false; }
  if (typeof tuple.objectType !== 'string') { return false; }
  return true;
}
module.exports.validateTuple = validateTuple;

function validateTuples(tuples) {
  if (!tuples) { return true; }
  for (var i = 0, len = tuples.length; i < len; i++) {
    if (!validateTuple(tuples[i])) {
      return false;
    }
  }
  return true;
}
module.exports.validateTuples = validateTuples;

function validateIconTuple(value) {
  if (!value) { return true;}
  return (ICON_OBJECT_TYPE.indexOf(value.objectType) >= 0);
}
module.exports.validateIconTuple = validateIconTuple;

function validateI18n(value) {
  if (!value) { return false;}
  if (! ('label' in value)) { return false; }
  if (! ('text' in value)) { return false; }
  return true;
}
module.exports.validateI18n = validateI18n;

function validateAction(value) {
  if (!value.url) { return false; }
  if (!value.display) { return false; }
  if (!value.display.label) { return false; }
  if (!value.display.text) { return false; }
  if (typeof value.url !== 'string') { return false; }
  if (typeof value.display.label !== 'string') { return false; }
  if (typeof value.display.text !== 'string') { return false; }
  return true;
}
module.exports.validateAction = validateAction;

function validateActions(value) {
  if (!value) { return true; }
  for (var i = 0, len = value.length; i < len; i++) {
    if (!validateAction(value[i])) {
      return false;
    }
  }
  return true;
}
module.exports.validateActions = validateActions;

function validateTargetTuples(value) {
  for (var i = 0, len = value.length; i < len; i++) {
    if (TARGET_OBJECT_TYPE.indexOf(value[i].objectType) < 0) {
      return false;
    }
  }
  return true;
}
module.exports.validateTargetTuples = validateTargetTuples;

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
