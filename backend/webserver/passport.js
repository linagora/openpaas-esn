'use strict';

const passport = require('passport'),
      mongoose = require('mongoose'),
      logger = require('../core/logger'),
      _ = require('lodash');

const config = require('../core').config('default'),
      User = mongoose.model('User');

passport.serializeUser((user, done) => {
  if (user && user.emails && user.emails.length && user.emails[0]) {
    return done(null, user.emails[0].value || user.emails[0]);
  }

  return done(new Error('Unable to serialize a session without email'));
});

passport.deserializeUser((username, done) => User.loadFromEmail(username, done));

try {
  passport.use('basic', require('./auth/basic').strategy);
  passport.use('oauth2-client-password', require('./auth/oauth2-client-password').strategy);
  passport.use('jwt-noauth', require('./auth/jwt-noauth').strategy);
} catch (err) {
  logger.error('Can not load the client strategies', err.message);
}

if (config.auth) {
  loadStrategiesInFolder(config.auth.strategies, './auth/');
  loadStrategiesInFolder(config.auth.apiStrategies, './auth/api/');
}

function loadStrategiesInFolder(strategies, folder) {
  _.forEach(strategies, strategy => {
    try {
      passport.use(strategy, require(folder + strategy).strategy);

      logger.debug(`Loaded passport strategy ${strategy} in folder ${folder}`);
    } catch (err) {
      logger.error(`Can not load the ${strategy} strategy in ${folder}. ${err} `);
    }
  });
}
