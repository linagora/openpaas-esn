'use strict';

var mongoose = require('mongoose');

var ConferenceSchema = new mongoose.Schema({
  name: {type: String},
  status: {type: String},
  creator: {type: mongoose.Schema.ObjectId, ref: 'User'},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  history: [{
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    status: {type: String, required: true},
    date: {type: Date, default: Date.now}
  }],
  attendees: [{
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    status: {type: String, required: true}
  }],
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Conference', ConferenceSchema);
