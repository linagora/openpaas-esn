'use strict';

var mongoose = require('mongoose');

var AttachmentSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId, required: true},
  name: {type: String, required: true},
  contentType: {type: String, required: true},
  length: {type: Number, required: true},
  file: {type: String, required: true}
});

module.exports = {
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  author: {type: mongoose.Schema.ObjectId, required: true},
  language: {type: String, required: false},
  attachments: {type: [AttachmentSchema], required: false },
  shares: [{
    objectType: {type: String},
    id: {type: String}
  }],
  responses: [mongoose.Schema.Mixed]
};
