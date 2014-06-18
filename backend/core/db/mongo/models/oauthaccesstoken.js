'use strict';

var mongoose = require('mongoose');

var OAuthAccessTokenSchema = new mongoose.Schema({
  accessToken: { type: String, unique: true, required: true },
  clientId: { type: mongoose.Schema.ObjectId, ref: 'OAuthClient', required: true },
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  expires: { type: Date },
  created: {type: Date, default: Date.now},
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('OAuthAccessToken', OAuthAccessTokenSchema);
