'use strict';

var async = require('async');

var logger = require('../../core/logger');
var userLogin = require('../../core/user/login');
var userModule = require('../../core/user');
var PasswordReset = require('mongoose').model('PasswordReset');

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
 * Update the password in the current user profile and remove associated PasswordReset entry
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
    PasswordReset.removeByEmail.bind(PasswordReset, req.user.preferredEmail)
  ], function(err) {
    if (err) {
      return res.status(500).json({error: 500, message: 'Server Error', details: err.message});
    }

    return res.status(200).end();
  });
}
module.exports.updateAndRemovePasswordReset = updateAndRemovePasswordReset;
