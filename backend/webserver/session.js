const session = require('express-session');
const cdm = require('connect-dynamic-middleware');
const setupSessions = require('./middleware/setup-sessions');

module.exports = () => {
  const sessionMiddleware = cdm(session({
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 6000000 },
    secret: 'this is the secret!'
  }));

  setupSessions(sessionMiddleware);

  return sessionMiddleware;
};
