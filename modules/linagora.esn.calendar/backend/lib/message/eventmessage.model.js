'use strict';

const extend = require('extend');
const mongoose = require('mongoose');

module.exports = dependencies => {
  const baseMessage = dependencies('db').mongo.models['base-message'];
  const eventSpecificSchema = {
    objectType: {type: String, required: true, default: 'event'},
    eventId: {type: String, required: true}
  };

  extend(true, eventSpecificSchema, baseMessage);
  mongoose.model('EventMessage', new mongoose.Schema(eventSpecificSchema, { collection: 'messages' }));
};
