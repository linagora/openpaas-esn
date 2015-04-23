'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ThingSchema = new Schema({
  name: String,
  content: String,
  timestamps: {
    created: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Thing', ThingSchema);
