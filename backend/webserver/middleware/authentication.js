'use strict';

const composableMiddleware = require('composable-middleware');
const passport = require('passport');
const config = require('../../core').config('default');
const coreAuthHandler = require('../../core/auth').handlers;

module.exports = {
  isAuthenticated,
  loginHandler,
  logoutHandler
};

function isAuthenticated(req, res, next) {
  const strategies = config.auth && config.auth.strategies ? config.auth.strategies : ['local'];

  return passport.authenticate(strategies, {failureRedirect: '/login', failureFlash: 'Invalid login or password.'})(req, res, next);
}

function loginHandler(req, res, next) {
  composableMiddleware(...coreAuthHandler.getLoginHandlers())(req, res, next);
}

function logoutHandler(req, res, next) {
  composableMiddleware(...coreAuthHandler.getLogoutHandlers())(req, res, next);
}
