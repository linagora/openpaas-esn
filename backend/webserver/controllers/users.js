'use strict';

//
// Users controller
//

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
  res.redirect('/');
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
