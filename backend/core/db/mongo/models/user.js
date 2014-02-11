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

UserSchema.statics = {

  /**
   * Load a user from one of its email
   *
   * @param {String} email
   * @param {Function} cb - as fn(err, user) where user is not null if found
   */
  loadFromEmail : function(email, cb) {
    this.findOne({emails: email}, cb);
  }
};

module.exports = mongoose.model('User', UserSchema);
