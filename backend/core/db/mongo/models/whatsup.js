'use strict';

var mongoose = require('mongoose');

var WhatsupSchema = new mongoose.Schema({
  objectType: {type: String, required: true, default: 'whatsup'},
  language: {type: String, required: false},
  content: {type: String, required: true},
  published: {type: Date, default: Date.now},
  author: {type: mongoose.Schema.ObjectId, required: true},
  shares: [{
    objectType: {type: String},
    id: {type: String}
  }],
  responses: [mongoose.Schema.Mixed]
}, { collection: 'messages' });

module.exports = mongoose.model('Whatsup', WhatsupSchema);
