'use strict';

var mongoose = require('mongoose');
var baseMessage = require('./base-message');
var extend = require('extend');

var whatsUpSpecificSchema = {
  objectType: {type: String, required: true, default: 'whatsup'},
  content: {type: String, required: true},
  published: {type: Date, default: Date.now}
};

extend(true, whatsUpSpecificSchema, baseMessage);
var WhatsupSchema = new mongoose.Schema(whatsUpSpecificSchema, { collection: 'messages' });

module.exports = mongoose.model('Whatsup', WhatsupSchema);
