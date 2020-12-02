/**
 * @deprecated The `oidc` strategy has been deprecated in favor of the `openid-connect` one.
 *
 * OpenID Connect Strategy based on passport HTTP bearer strategy:
 * - Get the accessToken from passport
 * - Get the user information from OpenID Connect Auth provider
 * - If user information is not found, do not send back error so that other startegies can be traversed
 */

const { promisify } = require('util');
const { parseOneAddress } = require('email-addresses');
const logger = require('../../../core/logger');
const oidc = require('../../../core/auth/oidc');
const userModule = require('../../../core/user');
const domainModule = require('../../../core/domain');
const BearerStrategy = require('passport-http-bearer').Strategy;

deprecated();

module.exports = {
  name: 'oidc',
  strategy: new BearerStrategy(oidcCallback),
  oidcCallback
};

function deprecated() {
  logger.warn('API Auth - OIDC : The "oidc" API strategy is deprecated and must be replaced by the "openid-connect" one');
}

function oidcCallback(accessToken, done) {
  deprecated();
  logger.debug('API Auth - OIDC : Authenticating user for accessToken', accessToken);

  oidc.getUserInfo(accessToken)
    .then(userInfo => {
      logger.debug('API Auth - OIDC : UserInfo from OIDC server', userInfo);
      if (!userInfo.email) {
        throw new Error('OIDC userinfo does not contain email');
      }

      return userInfo;
    })
    .then(userInfo => buildProfile(userInfo))
    .then(profile => findOrCreate(profile))
    .then(user => {
      if (!user) {
        throw new Error('No user found nor created from accessToken');
      }

      done(null, user);
    })
    .catch(err => {
      logger.warn('API Auth - OIDC : authentication from OpenID Connect accessToken failed', err && err.message || err);
      done(null, false, { message: `Can not validate OpenID Connect accessToken. ${err}` });
    });
}

function findOrCreate(profile) {
  const findByEmail = promisify(userModule.findByEmail);
  const provisionUser = promisify(userModule.provisionUser);

  return findByEmail(profile.email)
    .then(user => (user ? Promise.resolve(user) : provisionUser(userModule.translate(user, profile))));
}

function buildProfile(userInfo) {
  // TBD: Domain is defined from user email address TLD
  // In some providers, it is defined in clientId suffix
  const domainName = parseOneAddress(userInfo.email).domain;

  return getDomainByName(domainName).then(domainId => ({
    email: userInfo.email,
    username: userInfo.email,
    domainId
  }));
}

function getDomainByName(domainName) {
  return domainModule.getByName(domainName)
    .then(domain => (domain && domain.id))
    .then(domainId => {
      if (!domainId) {
        throw new Error('Can not find the domain with name', domainName);
      }

      return domainId;
    });
}
