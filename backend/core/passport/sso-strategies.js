// These single sign-on strategies are used to authenticate users just before
// they get to login page

const passport = require('passport');

const strategies = [];

module.exports = {
  middleware,
  register
};

function middleware(req, res, next) {
  if (req.isAuthenticated() || !strategies.length) {
    return next();
  }

  passport.authenticate(strategies)(req, res, next);
}

function register(name) {
  strategies.push(name);
}
