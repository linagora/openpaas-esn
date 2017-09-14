'use strict';

var mongoose = require('mongoose');
var uuidV4 = require('uuid/v4');

var ActivityStream = new mongoose.Schema({
  uuid: {type: String, default: uuidV4},
  stream_type: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  }
}, {_id: false});
module.exports.ActivityStream = ActivityStream;
