'use strict';

var emailAddresses = require('email-addresses');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
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
  password: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

UserSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods = {
  comparePassword: function(candidatePassword, cb) {
    if (!candidatePassword) {
      return cb(new Error('Can not compare with null password'));
    }
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  }
};

UserSchema.statics = {

  /**
   * Load a user from one of its email
   *
   * @param {String} email
   * @param {Function} cb - as fn(err, user) where user is not null if found
   */
  loadFromEmail: function(email, cb) {
    this.findOne({emails: email}, cb);
  }
};

module.exports = mongoose.model('User', UserSchema);
