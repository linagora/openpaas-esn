'use strict';

var mongoose = require('mongoose');
var I18n = require('./i18n').I18n;

var Action = new mongoose.Schema({
  url: {type: String, required: true},
  display: {type: I18n.tree, required: true}
}, {_id: false});
module.exports.Action = Action;

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
