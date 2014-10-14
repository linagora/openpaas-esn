'use strict';

var mongoose = require('mongoose');
var baseMessage = require('./base-message');
var extend = require('extend');

var eventSpecificSchema = {
  objectType: {type: String, required: true, default: 'event'},
  eventId: {type: String, required: true}
};

extend(true, eventSpecificSchema, baseMessage);
var EventMessageSchema = new mongoose.Schema(eventSpecificSchema, { collection: 'messages' });

module.exports = mongoose.model('EventMessage', EventMessageSchema);

