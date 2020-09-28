const async = require('async');
const _ = require('lodash');
const esnConfig = require('../esn-config');
const logger = require('../logger');
const utils = require('./utils');
const helpers = require('./helpers');
const coreUser = require('../user');
const { Client } = require('ldapts');
const { register, testAccessLdap } = require('./health-check');

const LDAP_DEFAULT_LIMIT = 50;
const SEARCH_SCOPE = 'sub';

module.exports = {
  findLDAPForUser,
  findDomainsBoundToEmail,
  emailExists,
  authenticate,
  translate,
  search,
  testAccessLdap,
  initHealthCheck
};

init();

function initHealthCheck() {
  register();
}

function init() {
  logger.info('Add ldap provision provider');
  coreUser.provision.service.addProvider(require('./provision-provider'));
}
/**
 * Check if the email exists in the given ldap
 *
 * @param {String} email - email to search
 * @param {hash} ldapConfig - LDAP configuration
 * @param {Function} callback - as fn(err, user) where user is defined if found
 */
function emailExists(email, ldapConfig, callback) {
  if (!email || !ldapConfig) {
    return callback(new Error('Missing parameters'));
  }

  const {
    adminDn = '',
    adminPassword = '',
    searchBase,
    searchFilter,
    url
  } = ldapConfig;

  let ldapClient;

  try {
    ldapClient = new Client({ url });
  } catch (err) {
    return callback(err);
  }
  const filter = searchFilter.replace(/{{username}}/g, utils.sanitizeInput(email));

  ldapClient.bind(adminDn, adminPassword)
    .then(() => ldapClient.search(searchBase, {
      scope: SEARCH_SCOPE,
      filter
    }))
    .then(({ searchEntries }) => {
      ldapClient.unbind();

      return callback(null, Array.isArray(searchEntries) && searchEntries[0]);
    })
    .catch(err => {
      ldapClient.unbind();

      return callback(err);
    });
}

/**
 * Try to find a user in all the registered LDAPs.
 *
 * @param {String} email - the email to search in the LDAPs
 * @param {Function} callback - as function(err, ldaps) where ldaps are LDAP entries that the user has been found
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

    const emailExistsInLdap = (ldap, _callback) => {
      const errorMsg = `Error while finding user ${email} in LDAP directory "${ldap.name}"`;

      emailExists(email, ldap.configuration, (err, user) => {
        if (err) {
          logger.debug(errorMsg, err);
        }

        _callback(null, !!user);
      });
    };

    async.filter(ldapConfigs, emailExistsInLdap, callback);
  }, callback);
}

/**
 * Find the domains bound to the given email
 *
 * @param {String} email
 */
function findDomainsBoundToEmail(email, callback) {
  const emailExistsInLdap = (ldap, _callback) => {
    const errorMsg = `Error while finding user ${email} in LDAP directory "${ldap.name}"`;

    emailExists(email, ldap.configuration, (err, user) => {
      if (err) {
        logger.debug(errorMsg, err);
      }

      _callback(null, !!user);
    });
  };

  return esnConfig('ldap').getFromAllDomains()
    .then(configs => {
      if (!configs || configs.length === 0) {
        return callback(null, []);
      }

      let ldapConfigs = configs.map(data => {
        if (!data || !data.config) {
          return;
        }

        const domainId = data.domainId;
        const ldaps = Array.isArray(data.config) ? data.config : [data.config];

        ldaps.forEach(ldap => {
          if (!ldap.domainId) {
            ldap.domainId = domainId;
          }
        });

        return ldaps;
      })
      .filter(Boolean);

      ldapConfigs = [].concat.apply([], ldapConfigs);

      if (!ldapConfigs || ldapConfigs.length === 0) {
        return callback(null, []);
      }

      async.filter(ldapConfigs, emailExistsInLdap, (err, results) => {
        callback(err, (results || []).filter(Boolean).map(ldap => ldap.domainId));
      });
    }, callback);
}

/**
 * Authenticate a user on the given LDAP
 *
 * @param {String} email
 * @param {String} password
 * @param {hash} ldapConf - LDAP configuration
 * @param {function} callback - as function(err, user) where user is nullable
 */
function authenticate(email, password, ldapConf, callback) {
  if (!email || !password || !ldapConf) {
    return callback(new Error('Can not authenticate from null values'));
  }

  let ldapClient;

  try {
    ldapClient = new Client({ url: ldapConf.url });
  } catch (err) {
    return callback(err);
  }

  emailExists(email, ldapConf, (err, foundUser) => {
    if (err) return callback(err);

    if (!foundUser) {
      return callback(null, null);
    }

    ldapClient.bind(foundUser.dn, password)
      .then(() => {
        ldapClient.unbind();

        return callback(null, foundUser);
      })
      .catch(err => {
        ldapClient.unbind();

        return callback(err);
      });
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
  const {
    adminDn = '',
    adminPassword = '',
    mapping,
    searchBase,
    searchFilter,
    url
  } = ldapConf;

  let ldapClient;

  try {
    ldapClient = new Client({ url });
  } catch (err) {
    return Promise.reject(err);
  }
  const uniqueAttr = utils.getUniqueAttr(searchFilter);

  if (!uniqueAttr) {
    return Promise.reject(new Error('Parsing searchFilter error'));
  }

  return ldapClient.bind(adminDn, adminPassword)
    .then(() => ldapClient.search(searchBase, {
      scope: SEARCH_SCOPE,
      filter: utils.buildSearchFilter(mapping, query.search),
      sizeLimit: query.limit || LDAP_DEFAULT_LIMIT
    }))
    .then(({ searchEntries }) => {
      ldapClient.unbind();

      return searchEntries.map(entry => ({
        username: entry[uniqueAttr],
        domainId: domainId,
        user: entry,
        config: {
          mapping: mapping
        }
      }));
    })
    .catch(err => {
      ldapClient.unbind();

      return Promise.reject(err);
    });
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
    return Promise.reject(new Error('Can not authenticate from null values'));
  }

  query.limit = query.limit || LDAP_DEFAULT_LIMIT;

  const domainId = user.preferredDomainId;

  return esnConfig('ldap').forUser(user).get().then(ldaps => {
    if (!ldaps || ldaps.length === 0) {
      return Promise.resolve({
        total_count: 0,
        list: []
      });
    }

    const promises = ldaps.filter(helpers.isLdapUsedForSearch).map(ldap => ldapSearch(domainId, ldap.configuration, query)
      .catch(err => {
        logger.error('Error while searching LDAP:', err);

        return Promise.resolve([]);
      })
    );
    let totalCount = 0;

    return Promise.all(promises).then(ldapSearchResults => {
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
