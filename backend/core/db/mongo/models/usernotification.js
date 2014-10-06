'use strict';

var mongoose = require('mongoose');

var iconObjectType = ['icon', 'url'];
var targetObjectType = ['user', 'community'];

function validateTuple(tuple) {
  if (!tuple) { return true; }
  if (! ('objectType' in tuple)) { return false; }
  if (! ('id' in tuple)) { return false; }
  if (typeof tuple.objectType !== 'string') { return false; }
  return true;
}

function validateIconTuple(value) {
  if (!value) { return true;}
  return (iconObjectType.indexOf(value.objectType) >= 0);
}

function validateI18n(value) {
  if (!value) { return false;}
  if (! ('label' in value)) { return false; }
  if (! ('text' in value)) { return false; }
  return true;
}

function validateAction(value) {
  if (!value.label) { return false; }
  if (!value.display) { return false; }
  if (!value.display.label) { return false; }
  if (!value.display.text) { return false; }
  if (typeof value.label !== 'string') { return false; }
  if (typeof value.display.label !== 'string') { return false; }
  if (typeof value.display.text !== 'string') { return false; }
  return true;
}

function validateActions(value) {
  if (!value) { return true; }
  for (var i = 0, len = value.length; i < len; i++) {
    if (!validateAction(value[i])) {
      return false;
    }
  }
  return true;
}

function validateTargetTuples(value) {
  for (var i = 0, len = value.length; i < len; i++) {
    if (targetObjectType.indexOf(value[i].objectType) < 0) {
      return false;
    }
  }
  return true;
}

var Tuple = new mongoose.Schema({
  objectType: {type: String, required: true},
  id: {type: mongoose.Schema.Types.Mixed, required: true}
}, {_id: false});

var I18n = new mongoose.Schema({
  label: {type: String, required: true},
  text: {type: String, required: true}
}, {_id: false});

var Action = new mongoose.Schema({
  url: {type: String, required: true},
  display: {type: I18n.tree, required: true}
}, {_id: false});

var NotificationSchema = new mongoose.Schema({
  subject: {type: Tuple.tree, required: true, validate: [validateTuple, 'Bad subject tuple']},
  verb: {type: I18n.tree, required: true, validate: [validateI18n, 'Bad verb i18n']},
  complement: {type: Tuple.tree, required: true, validate: [validateTuple, 'Bad complement tuple']},
  context: {type: Tuple.tree, validate: [validateTuple, 'Bad context tuple']},
  description: {Type: String},
  icon: {type: Tuple.tree, validate: [validateIconTuple, 'bad objectType']},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  category: {type: String, required: true},
  interactive: {type: Boolean, required: true, default: false},
  action: {type: [Action], validate: [validateActions, 'bad action']},
  target: {type: [Tuple], required: true, validate: [validateTargetTuples, 'bad target tuple objectType']},
  parentId: {type: mongoose.Schema.Types.ObjectId},
  read: {type: Boolean, default: false},
  acknowledged: {type: Boolean, default: false}
});

module.exports = mongoose.model('Usernotification', NotificationSchema);

