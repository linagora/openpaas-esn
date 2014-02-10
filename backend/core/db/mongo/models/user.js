'use strict';

var emailAddresses = require('email-addresses');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;



function validateEmail(email) {
  return emailAddresses.parseOneAddress(email) !== null;
}

function validateEmails(emails) {
  if (!emails || !emails.length) {
    return false;
  }
  var valid = true;
  emails.forEach(function(email) {
    if (!validateEmail(email)) {
      valid = false;
    }
  });
  return valid;
}



var UserSchema = new Schema({
  emails: {type: [String], required: true, unique: true, validate: validateEmails},
  firstname: {type: String},
  lastname: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('User', UserSchema);
