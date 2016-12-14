'use strict';

const mongoose = require('mongoose');
const User = mongoose.model('User');
const i18n = require('../../i18n');
const emailModule = require('../email');
const configHelper = require('../../helpers/config');

function checkPassword(user, password, callback) {
  const error = new Error('The passwords do not match.');

  user.comparePassword(password, function(err, isMatch) {
    if (err) {
      return callback(error);
    }

    return callback(isMatch ? null : error);
  });
}

function updatePassword(user, password, callback) {
  // OR-128 - Do not use findOneAndUpdate here because mongoose 3.x does not
  // support pre hook on update. We must use pre fook on save to crypt the password
  User.findOne({ _id: user._id || user }, function(err, user) {
    if (err) {
      return callback(err);
    }
    user.password = password;
    user.save(callback);
  });
}

function sendPasswordChangedConfirmation(user, template, callback) {
  const mailer = emailModule.getMailer(user);

  configHelper.getBaseUrl(user, function(err, url) {
    if (err) {
      return callback(err);
    }

    const locals = {
      firstname: user.firstname,
      lastname: user.lastname,
      url: url
    };

    mailer.sendHTML({to: user.preferredEmail, subject: i18n.__('Your password has been changed!')}, template, locals, callback);
  });
}

module.exports = {
  checkPassword,
  updatePassword,
  sendPasswordChangedConfirmation
};
