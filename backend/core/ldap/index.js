'use strict';

const LdapAuth = require('ldapauth-fork');
const async = require('async');
const _ = require('lodash');
const esnConfig = require('../esn-config');
const logger = require('../logger');
const utils = require('./utils');
const helpers = require('./helpers');
const q = require('q');
const coreUser = require('../user');

const LDAP_DEFAULT_LIMIT = 50;
const NOOP = () => {};

/**
 * Check if the email exists in the given ldap
 *
 * @param {String} email - email to search
 * @param {hash} ldap - LDAP configuration
 * @param {Function} callback - as fn(err, username) where username is defined if found
 */
function emailExists(email, ldap, callback) {
  if (!email || !ldap) {
    return callback(new Error('Missing parameters'));
  }

  const ldapauth = new LdapAuth(ldap);
  let called = false;

  ldapauth.on('error', err => {
    if (!called) {
      called = true;
      callback(err);
    }
  });

  return ldapauth._findUser(email, (err, data) => {
    ldapauth.close(NOOP);

    if (!called) {
      called = true;
      callback(err, data);
    }
  });
}

/**
 * Try to find a user in all the registered LDAPs.
 *
 * @param {String} email - the email to search in the LDAPs
 * @param {Function} callback - as fn(err, ldap) where ldap is the first LDAP entry where the user has been found
 */
function findLDAPForUser(email, callback) {
  return esnConfig('ldap').getFromAllDomains().then(configs => {
    if (!configs || configs.length === 0) {
      return callback(new Error('No configured LDAP'));
    }

    let ldapConfigs = configs.map(data => {
      if (!data || !data.config) {
        return;
      }

      const domainId = data.domainId;
      // each domain can have more than one LDAP directory
      const ldaps = Array.isArray(data.config) ? data.config : [data.config];

      // provide domainId for all LDAP configurations
      ldaps.forEach(ldap => {
        if (!ldap.domainId) {
          ldap.domainId = domainId;
        }
      });

      return ldaps;
    })
    .filter(Boolean);

    // make the array flat and filter LDAP used for authentication
    ldapConfigs = [].concat.apply([], ldapConfigs).filter(helpers.isLdapUsedForAuth);

    if (!ldapConfigs || ldapConfigs.length === 0) {
      logger.warn('No LDAP configured for authentication!');

      return callback(new Error('No LDAP configured for authentication'));
    }

    const emailExistsInLdap = (ldap, callback) => {
      const errorMsg = `Error while finding user ${email} in LDAP directory "${ldap.name}"`;

      emailExists(email, ldap.configuration, (err, username) => {
        if (err) {
          logger.debug(errorMsg, err);
        }

        callback(null, !!username);
      });
    };

    async.filter(ldapConfigs, emailExistsInLdap, callback);
  }, callback);
}

/**
 * Authenticate a user on the given LDAP
 *
 * @param {String} email
 * @param {String} password
 * @param {hash} ldap - LDAP configuration
 * @param {function} callback - as function(err, user) where user is nullable
 */
function authenticate(email, password, ldap, callback) {
  if (!email || !password || !ldap) {
    return callback(new Error('Can not authenticate from null values'));
  }

  const ldapauth = new LdapAuth(ldap);

  ldapauth.authenticate(email, password, function(err, user) {
    ldapauth.close(NOOP);

    if (err) {
      // Invalid credentials / user not found are not errors but login failures
     if (err.name === 'InvalidCredentialsError' ||
         err.name === 'NoSuchObjectError' ||
         (typeof err === 'string' && err.match(/no such user/i))
     ) {
      return callback(null, null);
     }

      // Other errors are (most likely) real errors
      return callback(err);
    }

    return callback(null, user);
  });
}

/**
 * Translate ldapPayload to OpenPaaS user
 *
 * @param  {Object} baseUser    The base user object to be extended
 * @param  {Object} ldapPayload The LDAP payload returned by LDAP strategy
 * @return {Object}             The OpenPaaS user object
 */
function translate(baseUser, ldapPayload) {
  const payload = {
    username: ldapPayload.username,
    domainId: ldapPayload.domainId,
    user: ldapPayload.user,
    mapping: ldapPayload.config.mapping
  };

  return coreUser.translate(baseUser, payload);
}

/**
 * Search ldap's users on each ldap's configuration
 *
 * @param {String} domainId   - Domain's identifier that ldap's configuration belong to
 * @param {Object} ldapConf   - Ldap's configuratin
 * @param {object} query      - Query object: {search: 'keyword', limit: 20}
 */
function ldapSearch(domainId, ldapConf, query) {
  const deferred = q.defer();
  const ldapauth = new LdapAuth(ldapConf);

  ldapauth.on('error', err => {
    if (err) {
      return deferred.reject(err);
    }
  });

  const uniqueAttr = utils.getUniqueAttr(ldapauth.opts.searchFilter);

  if (!uniqueAttr) {
    return deferred.reject(new Error('Parsing searchFilter error'));
  }

  const searchFilter = utils.buildSearchFilter(ldapConf.mapping, query.search);
  const opts = {
    filter: searchFilter,
    scope: ldapauth.opts.searchScope
  };

  if (ldapauth.opts.searchAttributes) {
    opts.attributes = ldapauth.opts.searchAttributes;
  }

  ldapauth._search(ldapauth.opts.searchBase, opts, (err, users) => {
    ldapauth.close(NOOP);

    if (err) {
      return deferred.reject(err);
    }

    const ldapPayloads = users.map(user => {
      const ldapPayload = {
        username: user[uniqueAttr],
        domainId: domainId,
        user: user,
        config: {
          mapping: ldapConf.mapping
        }
      };

      return ldapPayload;
    });

    return deferred.resolve(ldapPayloads);
  });

  return deferred.promise;
}

/**
 * Search ldap's users on list ldap's configurations of a domain
 *
 * @param {Object} user       - User object who are searching ldap users
 * @param {Object} query      - Query object: {search: 'keyword', limit: 20}
 * @return {Object}           - {total_count: 20, list: [user1, user2]} where:
 *                              total_count: is total of users without limited,
 *                              list: is an array of users is limited by query.limit
 */
function search(user, query) {
  if (!query || !user) {
    return q.reject(new Error('Can not authenticate from null values'));
  }

  query.limit = query.limit || LDAP_DEFAULT_LIMIT;

  const domainId = user.preferredDomainId;

  return esnConfig('ldap').forUser(user).get().then(ldaps => {
    if (!ldaps || ldaps.length === 0) {
      return q({
        total_count: 0,
        list: []
      });
    }

    const promises = ldaps.filter(helpers.isLdapUsedForSearch).map(ldap => ldapSearch(domainId, ldap.configuration, query)
        .catch(err => {
          logger.error('Error while searching LDAP:', err);

          return q([]);
        })
    );
    let totalCount = 0;

    return q.all(promises).then(ldapSearchResults => {
      const ldapsUsers = [];

      ldapSearchResults.map(ldapPayloads => {
        const ldapUsers = ldapPayloads.map(ldapPayload => {
          const user = translate(null, ldapPayload);

          user._id = ldapPayload.username;
          user.emails = _.find(user.accounts, { type: 'email' }).emails;
          user.preferredEmail = user.emails[0];

          return user;
        });

        totalCount += ldapUsers.length;
        ldapsUsers.push(ldapUsers);
      });

      const users = utils.aggregate(ldapsUsers, query.limit);

      return {
        total_count: totalCount,
        list: users
      };
    });
  });
}

module.exports = {
  findLDAPForUser,
  emailExists,
  authenticate,
  translate,
  search
};
