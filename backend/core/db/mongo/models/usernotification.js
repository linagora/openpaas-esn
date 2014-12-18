'use strict';

var mongoose = require('mongoose');
var tuple = require('../schemas/tuple');
var action = require('../schemas/action');
var i18n = require('../schemas/i18n');
var Tuple = tuple.Tuple;
var Action = action.Action;
var I18n = i18n.I18n;

var NotificationSchema = new mongoose.Schema({
  subject: {type: Tuple.tree, required: true, validate: [tuple.validateTuple, 'Bad subject tuple']},
  verb: {type: I18n.tree, required: true, validate: [i18n.validateI18n, 'Bad verb i18n']},
  complement: {type: Tuple.tree, required: true, validate: [tuple.validateTuple, 'Bad complement tuple']},
  context: {type: Tuple.tree, validate: [tuple.validateTuple, 'Bad context tuple']},
  description: {Type: String},
  icon: {type: Tuple.tree, validate: [tuple.validateIconTuple, 'bad objectType']},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  category: {type: String, required: true},
  interactive: {type: Boolean, required: true, default: false},
  action: {type: [Action], validate: [action.validateActions, 'bad action']},
  target: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
  parentTarget: {type: [Tuple], validate: [tuple.validateTargetTuples, 'bad parent target tuple objectType']},
  read: {type: Boolean, default: false},
  acknowledged: {type: Boolean, default: false}
});

module.exports = mongoose.model('Usernotification', NotificationSchema);
