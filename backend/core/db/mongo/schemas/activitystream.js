'use strict';

var mongoose = require('mongoose');
var uuid = require('node-uuid');

var ActivityStream = new mongoose.Schema({
  uuid: {type: String, default: uuid.v4},
  stream_type: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  }
}, {_id: false});
module.exports.ActivityStream = ActivityStream;
