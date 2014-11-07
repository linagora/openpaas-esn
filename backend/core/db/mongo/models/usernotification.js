'use strict';

var mongoose = require('mongoose');
var validation = require('../validation');
var common = require('../common');
var Tuple = common.Tuple;
var Action = common.Action;
var I18n = common.I18n;

var NotificationSchema = new mongoose.Schema({
  subject: {type: Tuple.tree, required: true, validate: [validation.validateTuple, 'Bad subject tuple']},
  verb: {type: I18n.tree, required: true, validate: [validation.validateI18n, 'Bad verb i18n']},
  complement: {type: Tuple.tree, required: true, validate: [validation.validateTuple, 'Bad complement tuple']},
  context: {type: Tuple.tree, validate: [validation.validateTuple, 'Bad context tuple']},
  description: {Type: String},
  icon: {type: Tuple.tree, validate: [validation.validateIconTuple, 'bad objectType']},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  category: {type: String, required: true},
  interactive: {type: Boolean, required: true, default: false},
  action: {type: [Action], validate: [validation.validateActions, 'bad action']},
  target: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
  parentTarget: {type: [Tuple], validate: [validation.validateTargetTuples, 'bad parent target tuple objectType']},
  read: {type: Boolean, default: false},
  acknowledged: {type: Boolean, default: false}
});

module.exports = mongoose.model('Usernotification', NotificationSchema);
