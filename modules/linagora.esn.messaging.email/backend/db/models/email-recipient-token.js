'use strict';

var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var EmailRecipientToken = new mongoose.Schema({
  user: {type: Schema.ObjectId, ref: 'User', required: true},
  message: {
    objectType: {type: String, required: true, default: 'whatsup'},
    id: {type: Schema.Types.Mixed, required: true}
  },
  token: {type: String},
  created: {type: Date, default: Date.now },
  schemaVersion: {type: Number, default: 1}
});

EmailRecipientToken.pre('save', function(next) {
  if (!this.isNew) {
    return next();
  }
  this.token = uuid.v4();
  next();
});

module.exports = mongoose.model('EmailRecipientToken', EmailRecipientToken);
