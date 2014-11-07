'use strict';

var mongoose = require('mongoose');

var ICON_OBJECT_TYPE = ['icon', 'url'];
module.exports.ICON_OBJECT_TYPE = ICON_OBJECT_TYPE;

var TARGET_OBJECT_TYPE = ['user', 'community'];
module.exports.TARGET_OBJECT_TYPE = TARGET_OBJECT_TYPE;

var Tuple = new mongoose.Schema({
  objectType: {type: String, required: true},
  id: {type: mongoose.Schema.Types.Mixed, required: true}
}, {_id: false});
module.exports.Tuple = Tuple;

var I18n = new mongoose.Schema({
  label: {type: String, required: true},
  text: {type: String, required: true}
}, {_id: false});
module.exports.I18n = I18n;

var Action = new mongoose.Schema({
  url: {type: String, required: true},
  display: {type: I18n.tree, required: true}
}, {_id: false});
module.exports.Action = Action;

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
