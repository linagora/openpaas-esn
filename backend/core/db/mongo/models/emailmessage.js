'use strict';

var mongoose = require('mongoose');
var baseMessage = require('./base-message');
var extend = require('extend');

var Address = new mongoose.Schema({
  address: {type: String, required: true},
  name: {type: String}
}, {_id: false});

var emailSpecificSchema = {
  objectType: {type: String, required: true, default: 'email'},
  headers: [mongoose.Schema.Mixed],
  parsedHeaders: {
    to: {type: [Address]},
    from: {type: Address.tree},
    cc: {type: [Address]},
    bcc: {type: [Address]},
    subject: {type: String},
    date: {type: Date}
  },
  body: {
    text: {type: String, required: false},
    html: {type: String, required: false}
  }
};

extend(true, emailSpecificSchema, baseMessage);
var EmailMessageSchema = new mongoose.Schema(emailSpecificSchema, { collection: 'messages' });

module.exports = mongoose.model('EmailMessage', EmailMessageSchema);
