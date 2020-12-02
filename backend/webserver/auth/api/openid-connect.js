/**
 * OpenID Connect Strategy based on passport HTTP bearer strategy:
 * - Get the accessToken from passport
 * - Get the user information from OpenID Connect Auth provider
 * - If user information is not found, do not send back error so that other strategies can be traversed
 */

const { promisify } = require('util');
const { parseOneAddress } = require('email-addresses');
const logger = require('../../../core/logger');
const { getUserInfosFromProvider } = require('../../../core/auth/openid-connect');
const userModule = require('../../../core/user');
const domainModule = require('../../../core/domain');
const ldapModule = require('../../../core/ldap');
const { get, set } = require('../../../core/auth/openid-connect/cache');
const BearerStrategy = require('passport-http-bearer').Strategy;
const findByEmail = promisify(userModule.findByEmail);
const provisionUser = promisify(userModule.provisionUser);
const loadDomain = promisify(domainModule.load);
const findDomainsBoundToEmail = promisify(ldapModule.findDomainsBoundToEmail);

module.exports = {
  name: 'openid-connect',
  strategy: new BearerStrategy(oidcCallback),
  oidcCallback: oidcCallback
};

const callbackId = 0;

function oidcCallback(accessToken, done) {
  const myId = ++callbackId;

  logger.debug(`API Auth - OIDC: [${myId}] oidcCallback starts`)

  const user = get(accessToken);

  if (user) {
    done(null, user);
    return;
  }

  getUserInfosFromProvider(accessToken)
    .then(response => {
      logger.debug(`API Auth - OIDC: [${myId}] provider response: ${JSON.stringify(response)}`);
      if (!response || !response.infos || !response.infos.email) {
        throw new Error(`API Auth - OIDC: [${myId}] Payload must contain required "email" field`);
      }

      const { infos } = response;

      return findByEmail(infos.email)
        .then(user => (user ? Promise.resolve(user) : buildAndProvisionUser(infos)));
    })
    .then(user => {
      if (!user) {
        throw new Error(`API Auth - OIDC: [${myId}] No user found nor created from accessToken`);
      }

      set(accessToken, user);

      done(null, user);
    })
    .catch(err => {
      logger.error(`API Auth - OIDC: [${myId}] Error while authenticating user from OpenID Connect accessToken`, err);
      done(null, false, { message: `Cannot validate OpenID Connect accessToken: ${err.message} ${err.stack}` });
    });
}

function buildAndProvisionUser(userInfo) {
  return buildProfile(userInfo)
    .then(profile => provisionUser(userModule.translate({}, profile)));
}

function buildProfile(userInfo) {
  return searchDomainFromEmail(userInfo.email)
    .then(domain => {
      if (!domain) {
        throw new Error(`API Auth - OIDC: Can not find any valid domain for ${userInfo.email}`);
      }

      return {
        email: userInfo.email,
        username: userInfo.email,
        domainId: domain._id
      };
    });
}

/**
 * Get the domain from email and fallback like:
 *
 * 1. Get the domain from the User if exists
 * 2. Fallback by look into the LDAPs
 * 3. Fallback by trying to find the domain from the email domain name
 *
 * @param {String} email
 */
function searchDomainFromEmail(email) {
  return findDomainFromLDAP(email)
    .then(domain => (domain ? Promise.resolve(domain) : findDomainFromEmailDomainName(email)));
}

/**
 * Try to find the domain where email can be found in LDAP.
 *
 * @param {String} email
 */
function findDomainFromLDAP(email) {
  return findDomainsBoundToEmail(email)
    .then(domainIds => (domainIds && domainIds.length ? domainIds[0] : null))
    .then(domainId => (domainId ? loadDomain(domainId) : null))
    .catch(err => logger.debug('API Auth - OIDC : Domain can not be found nor loaded in LDAP', err));
}

function findDomainFromEmailDomainName(email) {
  const domainName = parseOneAddress(email).domain;

  return domainModule.getByName(domainName)
    .catch(err => logger.debug(`API Auth - OIDC : Can not search domain from domain name ${domainName}`, err));
}
