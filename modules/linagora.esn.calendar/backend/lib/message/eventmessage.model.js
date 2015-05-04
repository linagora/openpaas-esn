'use strict';

var extend = require('extend');
var mongoose = require('mongoose');

module.exports = function(dependencies) {
  var baseMessage = dependencies('db').mongo.models['base-message'];

  var eventSpecificSchema = {
    objectType: {type: String, required: true, default: 'event'},
    eventId: {type: String, required: true}
  };

  extend(true, eventSpecificSchema, baseMessage);
  var EventMessageSchema = new mongoose.Schema(eventSpecificSchema, { collection: 'messages' });

  mongoose.model('EventMessage', EventMessageSchema);
};
