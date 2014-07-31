'use strict';

var mongoose = require('mongoose');

var EMailMsgSchema = new mongoose.Schema({
  objectType: {type: String, required: true, default: 'email'},
  author: {type: mongoose.Schema.ObjectId, required: true},
  language: {type: String, required: false},
  published: {type: Date, default: Date.now},
  from: {type: String, required: true},
  to: {type: [String], required: true},
  cc: {type: [String], required: false},
  subject: {type: String, required: true},
  content: {type: String, required: true},
  attachments: {type: [String], required: false },
  shares: [{
    objectType: {type: String},
    id: {type: String}
  }],
  responses: [mongoose.Schema.Mixed]
}, { collection: 'messages' });

module.exports = mongoose.model('EMailMsg', EMailMsgSchema);
