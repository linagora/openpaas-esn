'use strict';

var async = require('async');

var i18n = require('../../i18n');
var logger = require('../../core/logger');
var userLogin = require('../../core/user/login');
var userModule = require('../../core/user');
var emailModule = require('../../core/email');
var configHelper = require('../../helpers').config;
var PasswordReset = require('mongoose').model('PasswordReset');

function _sendConfirmation(user, template, callback) {
  var mailer = emailModule.getMailer(user.preferredDomainId);

  configHelper.getBaseUrl(user, function(err, url) {
    if (err) {
      return callback(err);
    }

    var locals = {
      firstname: user.firstname,
      lastname: user.lastname,
      url: url
    };

    mailer.sendHTML({to: user.preferredEmail, subject: i18n.__('Your password has been changed!')}, template, locals).then(function() {
      callback();
    }, callback);
  });
}

function sendPasswordReset(req, res) {
  userLogin.sendPasswordReset(req.user, function(err) {
    if (err) {
      logger.error('Error while sending password reset', err);

      return res.status(500).json({error: {code: 500, message: 'Server error', details: err.message}});
    }

    return res.status(200).end();
  });
}
module.exports.sendPasswordReset = sendPasswordReset;

/**
 * Update the password of the current user profile and remove associated PasswordReset entry
 *
 * @param {Request} req
 * @param {Response} res
 */

function updateAndRemovePasswordReset(req, res) {
  if (!req.body || !req.body.password) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'No password defined'});
  }

  async.series([
    userModule.updatePassword.bind(null, req.user, req.body.password),
    PasswordReset.removeByEmail.bind(PasswordReset, req.user.preferredEmail),
    _sendConfirmation.bind(null, req.user, 'core.password-reset-confirmation')
  ], function(err) {
    if (err) {
      return res.status(500).json({error: 500, message: 'Server Error', details: err.message});
    }

    return res.status(200).end();
  });
}
module.exports.updateAndRemovePasswordReset = updateAndRemovePasswordReset;

/**
 * Change the password of the current user profile
 *
 * @param {Request} req
 * @param {Response} res
 */

function changePassword(req, res) {
  if (!req.body || !req.body.oldpassword || !req.body.newpassword) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'No passwords defined'});
  }

  async.series([
    userModule.checkPassword.bind(null, req.user, req.body.oldpassword),
    userModule.updatePassword.bind(null, req.user, req.body.newpassword),
    _sendConfirmation.bind(null, req.user, 'core.change-password-confirmation')
  ], function(err) {
    if (err) {
      if (err.message === 'Unmatched password') {
        return res.status(400).json({error: 400, message: 'Bad Request', details: err.message});
      }

      return res.status(500).json({error: 500, message: 'Server Error', details: err.message});
    }

    return res.status(200).end();
  });
}
module.exports.changePassword = changePassword;
