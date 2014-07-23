'use strict';

var mongoose = require('mongoose');

var FeedbackSchema = new mongoose.Schema({
  content: {type: String, required: true},
  published: {type: Date, default: Date.now},
  author: {type: mongoose.Schema.ObjectId, required: true}
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
