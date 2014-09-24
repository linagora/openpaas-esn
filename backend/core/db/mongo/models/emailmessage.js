'use strict';

var mongoose = require('mongoose');

var MessageAttachmentSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId, required: true},
  name: {type: String, required: false},
  contentType: {type: String, required: true},
  length: {type: Number, required: true}
});

var Address = new mongoose.Schema({
  address: {type: String, required: true},
  name: {type: String}
}, {_id: false});

var EmailMessageSchema = new mongoose.Schema({
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  objectType: {type: String, required: true, default: 'email'},
  author: {type: mongoose.Schema.ObjectId, required: true},
  language: {type: String, required: false},
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
  },
  attachments: {type: [MessageAttachmentSchema], required: false },
  shares: [{
    objectType: {type: String},
    id: {type: String}
  }],
  responses: [mongoose.Schema.Mixed]
}, { collection: 'messages' });

module.exports = mongoose.model('EmailMessage', EmailMessageSchema);
