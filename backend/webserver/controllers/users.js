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
 * Show the login page if the user is not logged in.
 *
 * @param {request} req
 * @param {response} res
 */
function login(req, res) {
  if (req.user) {
    return res.redirect('/');
  }

  res.render('users/login', {
    title: 'Login',
    message: req.flash('error')
  });
}
module.exports.login = login;

/**
 * Once logged in, redirect to /.
 * When this controller method is called, it means that the authentication is already OK.
 *
 * @param {request} req
 * @param {response} res
 */
function logmein(req, res) {
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
 * Shows the user account.
 *
 * @param {request} req
 * @param {response} res
 */
function account(req, res) {
  var user = req.user;
  res.render('users/account', {
    title: user.name,
    user: user
  });
}
module.exports.account = account;
