'use strict';

var emailAdresses = require('email-addresses');
var userModule = require('../../core').user;

//
// Users controller
//

function getEmailsFromPassportProfile(profile) {
  var emails = profile.emails
    .filter(function(email) {
      return (email && email.value && emailAdresses.parseOneAddress(email.value));
    })
    .map(function(email) { return email.value + ''; });
  return emails;
}

/**
 * Provision the user from the request, redirect to / once done.
 * When this controller method is called, it means that the authentication is already OK.
 *
 * @param {request} req
 * @param {response} res
 */
function provision(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    res.send(500, 'User not set');
  }

  var emails = getEmailsFromPassportProfile(req.user);
  if (!emails.length) {
    res.send(500, 'No valid email address found');
  }
  userModule.findByEmail(emails, function(err, user) {
    if (err) {
      return res.send(500, 'Unable to lookup user ' + emails + ': ' + err);
    } else if (user && user.emails) {
      return res.redirect('/');
    }

    userModule.provisionUser({emails: emails}, function(err, user) {
      if (err) {
        return res.send(500, 'Unable to provision user ' + req.user + ': ' + err);
      }
      return res.redirect('/');
    });
  });
}
module.exports.provision = provision;

/**
 * Log the user in. The user should already be loaded in the request from a middleware.
 */
function logmein(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, 'User not set');
  }
  return res.redirect('/');
}
module.exports.logmein = logmein;


/**
 * Logout the current user
 *
 * @param {request} req
 * @param {response} res
 */
function logout(req, res) {
  req.logout();
  res.redirect('/login');
}
module.exports.logout = logout;

/**
 * Get a user profile.
 *
 * @param {request} req
 * @param {response} res
 */
function profile(req, res) {
  var uuid = req.params.uuid;
  if (!uuid) {
    return res.json(400, {error: {code: 400, message: 'Bad parameters', details: 'User ID is missing'}});
  }

  userModule.get(uuid, function(err, user) {
    if (err) {
      return res.json(500, {
        error: 500,
        message: 'Error while loading user ' + uuid,
        details: err.message
      });
    }

    if (!user) {
      return res.json(404, {
        error: 404,
        message: 'User not found',
        details: 'User ' + uuid + ' has not been found'
      });
    }
    return res.json(200, user);
  });
}
module.exports.profile = profile;

/**
 * Returns the current authenticated user
 *
 * @param {Request} req
 * @param {Response} res
 */
function user(req, res) {
  if (!req.user) {
    return res.json(404, {error: 404, message: 'Not found', details: 'User not found'});
  }
  return res.json(200, req.user);
}
module.exports.user = user;
