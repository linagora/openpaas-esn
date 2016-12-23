'use strict';

const async = require('async');

const i18n = require('../../i18n');
const logger = require('../../core/logger');
const userLogin = require('../../core/user/login');
const userPassword = require('../../core/user/password');
const emailModule = require('../../core/email');
const configHelper = require('../../helpers').config;
const PasswordReset = require('mongoose').model('PasswordReset');

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
    userPassword.updatePassword.bind(null, req.user, req.body.password),
    PasswordReset.removeByEmail.bind(PasswordReset, req.user.preferredEmail),
    userPassword.sendPasswordChangedConfirmation.bind(null, req.user, 'core.password-reset-confirmation')
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
    userPassword.checkPassword.bind(null, req.user, req.body.oldpassword),
    userPassword.updatePassword.bind(null, req.user, req.body.newpassword),
    userPassword.sendPasswordChangedConfirmation.bind(null, req.user, 'core.change-password-confirmation')
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
