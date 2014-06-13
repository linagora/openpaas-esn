'use strict';

var mongoose = require('mongoose'),
    utils = require('../../../../helpers/oauthutils');

var OAuthClientSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  clientId: { type: String, unique: true, required: true },
  clientSecret: { type: String, required: true },
  redirectUri: { type: String },
  created: { type: Date, default: Date.now },
  schemaVersion: {type: Number, default: 1}
});

OAuthClientSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next();
  }
  this.clientId = utils.uid(20);
  this.clientSecret = utils.uid(40);
  next();
});

module.exports = mongoose.model('OAuthClient', OAuthClientSchema);
