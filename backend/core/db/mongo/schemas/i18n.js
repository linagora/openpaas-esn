'use strict';

var mongoose = require('mongoose');

var I18n = new mongoose.Schema({
  label: {type: String, required: true},
  text: {type: String, required: true}
}, {_id: false});
module.exports.I18n = I18n;

function validateI18n(value) {
  if (!value) { return false;}
  if (! ('label' in value)) { return false; }
  if (! ('text' in value)) { return false; }
  return true;
}
module.exports.validateI18n = validateI18n;

