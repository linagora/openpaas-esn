const Q = require('q');
const emailAddresses = require('email-addresses');
const userModule = require('../user');
const { EsnConfig } = require('../esn-config');
const { isLdapUsedForAuth } = require('./helpers');
const { emailExists, translate } = require('./index');
const { ProvisionProvider } = require('../user/provision');

module.exports = new ProvisionProvider('ldap', provision, verify);

function verify({ data }) {
  if (!data || !Array.isArray(data)) {
    return Promise.reject({
      valid: false,
      details: 'Input data must be an array'
    });
  }

  const invalidEmails = data.filter(email => !emailAddresses.parseOneAddress(email));

  if (invalidEmails.length) {
    return Promise.reject({
      valid: false,
      details: `Input data contains invalid emails: ${invalidEmails.join(', ')}`
    });
  }

  return Promise.resolve();
}

function provision({ data, domainId }) {
  return _getAuthLdapsOfDomain(domainId).then(ldaps => {
    const promises = data.map(email => _getLdapUser(email, ldaps));

    return Promise.all(promises)
      .then(ldapUsers => ldapUsers.filter(Boolean))
      .then(usersToProvision => Promise.all(usersToProvision.map(_provisionOrUpdate)));
  });
}

function _getAuthLdapsOfDomain(domainId) {
  return new EsnConfig('core', domainId).get('ldap')
    .then(connectors => connectors.filter(isLdapUsedForAuth))
    .then(connectors => connectors.map(connector => {
      connector.domainId = domainId; //Assign domain-id for each LDAP connection

      return connector;
    }));
}

function _getLdapUser(email, ldapConfigs) {
  const promises = ldapConfigs.map(ldapConfig => Q.denodeify(emailExists)(email, ldapConfig.configuration).then(ldapData => ({
    email,
    ldapData,
    ldapConfig
  })));

  return Q.allSettled(promises)
    .then(allPromises => allPromises.filter(promise => promise.state === 'fulfilled').map(promise => promise.value))
    .then(fulFilled => fulFilled.filter(result => !!(result.ldapData)))
    .then(results => results[0]); //We only get ldap data from the first connection with result
}

function _provisionOrUpdate(user) {
  return Q.ninvoke(userModule, 'findByEmail', user.email).then(userFound => {
    const method = userFound ? 'update' : 'provisionUser';
    const data = translate(userFound, {
      username: user.email,
      user: user.ldapData,
      config: user.ldapConfig.configuration,
      domainId: user.ldapConfig.domainId
    });

    return Q.ninvoke(userModule, method, data);
  });
}
