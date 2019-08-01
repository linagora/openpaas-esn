/**
 * OpenID Connect Strategy based on passport HTTP bearer strategy:
 * - Get the accessToken from passport
 * - Get the user information from OpenID Connect Auth provider
 * - If user information is not found, do not send back error so that other startegies can be traversed
 */

const util = require('util');
const logger = require('../../../core/logger');
const oidc = require('../../../core/auth/oidc');
const userModule = require('../../../core/user');
const BearerStrategy = require('passport-http-bearer').Strategy;

const findByEmail = util.promisify(userModule.findByEmail);

module.exports = {
  name: 'oidc',
  strategy: new BearerStrategy(oidcCallback),
  oidcCallback
};

function oidcCallback(accessToken, done) {
  oidc.getUserInfo(accessToken)
    .then(userInfo => {
      if (!userInfo.email) {
        throw new Error('OIDC userinfo does not contain email');
      }

      return userInfo;
    })
    .then(userInfo => findByEmail(userInfo.email))
    .then(user => {
      if (!user) {
        throw new Error('No user found for accessToken');
      }

      done(null, user);
    })
    .catch(err => {
      logger.error('Error while authenticating user from OpenID Connect accessToken', err);
      done(null, false, { message: `Can not validate OpenID Connect accessToken. ${err}` });
    });
}
