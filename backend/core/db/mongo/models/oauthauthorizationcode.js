'use strict';

var mongoose = require('mongoose');

var OAuthAuthorizationCodeSchema = new mongoose.Schema({
  code: { type: String},
  redirectUri: { type: String, required: true },
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.ObjectId, ref: 'OAuthClient', required: true },
  created: {type: Date, default: Date.now},
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);
