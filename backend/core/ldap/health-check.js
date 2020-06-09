const { registry, buildHealthyMessage, buildUnhealthyMessage, HealthCheckProvider, STATUSES } = require('../health-check');
const logger = require('../logger');
const esnConfig = require('../../core/esn-config');
const Q = require('q');
const { Client } = require('ldapts');

module.exports = {
  register,
  testAccessLdap
};

const SERVICE_NAME = 'ldap';
const STATE_FULFILLED = 'fulfilled';
/**
 * Register LDAP as a HealthCheckProvider
 */
function register() {
  return registry.register(new HealthCheckProvider(SERVICE_NAME, checker));
}

/**
 * Checks for LDAP connection, then returns formatted result
 */
function checker() {
  const message = 'Health check: Something went wrong with LDAP connection.';

  return checkConnection()
    .then(result => (result && result.state ? buildHealthyMessage(SERVICE_NAME, result.details) : buildUnhealthyMessage(SERVICE_NAME, message, result.details))
    )
    .catch(error => {
      logger.debug(message, error);

      return buildUnhealthyMessage(SERVICE_NAME, error.message || error || message);
    });
}

/**
 * Check for all LDAP connections, return overall state & details
 */
function checkConnection() {
  return listLdapConnections()
    .then(connections => testMultipleLdapConnection(connections))
    .then(results => ({
      state: !results.find(ldapResult => ldapResult.state === STATUSES.UNHEALTHY),
      details: results
    }));
}

/**
 * Test multiple ldap connections using testAccessLdap, then return an object with state, message (if unhealthy) & further details
 * @param {array} ldapObjects
 * @example: [
 *  {
 *    configuration: {
 *      mapping: array
 *      url: string
 *      adminDn: string
 *      adminPassword: string
 *    },
 *    name: string
 *    domainId: string
 *  }
 * ]
 */
function testMultipleLdapConnection(ldapObjects) {
  return Q.allSettled(ldapObjects.map(ldapObject => testAccessLdap(ldapObject.configuration)))
    .then(results => results.map((result, index) => ({
      ...ldapObjects[index],
      state: result.state === STATE_FULFILLED ? STATUSES.HEALTHY : STATUSES.UNHEALTHY,
      message: result.state === STATE_FULFILLED ? result.value : result.reason
    })
  ));
}

/**
 * Test LDAP Access connection. Returns a promise, if resolved => access is ok and otherwise.
 *
 * @param {hash} ldapConfig - LDAP configuration
 * @example {
 *   adminDn: string
 *   adminPassword: string
 *   url: string
 * }
 */
function testAccessLdap(ldapConfig) {
  return new Promise((resolve, reject) => {
    const {
      adminDn,
      adminPassword,
      url
    } = ldapConfig;

    let ldapClient;
    try {
      ldapClient = new Client({ url });
    } catch (err) {
      return reject(err.message || err);
    }
    ldapClient.bind(adminDn, adminPassword)
      .then(() => {
        ldapClient.unbind();
        return resolve(true);
      })
      .catch(err => {
        ldapClient.unbind();
        logger.debug(err);
        return reject(err);
      });
  });
}

/**
 * List all ldap connections with configuration of all domains
 * @returns: [
 *  {
 *    configuration: {
 *      mapping: array
 *      url: string
 *      adminDn: string
 *      adminPassword: string
 *    },
 *    name: string
 *    domainId: string
 *  }
 * ]
 */
function listLdapConnections() {
  return esnConfig('ldap').getFromAllDomains().then(domainConfigurations =>
    domainConfigurations.reduce((results, domainConfiguration) => ([
      ...results,
      ...(domainConfiguration.config || []).map(config => ({
        ...config,
        domainId: domainConfiguration.domainId
      }))
    ]), [])
  );
}
