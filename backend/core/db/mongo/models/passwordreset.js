'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PasswordResetSchema = new Schema({
  timestamps: {
    created: {type: Date, default: Date.now}
  },
  email: {type: String, unique: true},
  url: {type: String, unique: true},
  schemaVersion: {type: Number, default: 1}
});

PasswordResetSchema.statics = {
  removeByEmail: function(email, callback) {
    this.findOne({email: email}).deleteOne(callback);
  }
};

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
