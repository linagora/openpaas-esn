'use strict';

var mongoose = require('mongoose'),
    randomstring = require('randomstring');

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
  this.clientId = randomstring.generate(20);
  this.clientSecret = randomstring.generate(40);
  next();
});

module.exports = mongoose.model('OAuthClient', OAuthClientSchema);
