'use strict';

var mongoose = require('mongoose');

var AttendeeSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.ObjectId, ref: 'User'},
  timestamps: [{
    date: {type: Date, default: Date.now},
    step: {type: String}
  }]
}, { _id: false });

var ConferenceSchema = new mongoose.Schema({
  name: {type: String},
  status: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  creator: {type: mongoose.Schema.ObjectId, ref: 'User'},
  attendees: {type: [AttendeeSchema]},
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Conference', ConferenceSchema);
