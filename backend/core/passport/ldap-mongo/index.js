const q = require('q');
const { promisify } = require('util');
const logger = require('../../logger');
const ldapModule = require('../../ldap');
const helpers = require('../../ldap/helpers');
const userModule = require('../../user');

const metadata = userModule.metadata;
const findUserByEmail = promisify(userModule.findByEmail);
const updateUser = promisify(userModule.update);
const provisionUser = promisify(userModule.provisionUser);

module.exports = (username, password, done) => {
  ldapModule.findLDAPForUser(username, (err, ldaps) => {
    if (err) {
      return done(null, false, { message: `LDAP is not configured for user ${username}. ${err}` });
    }

    if (!ldaps || ldaps.length === 0) {
      return done(null, false, { message: 'Can not find any LDAP for this user' });
    }

    q.allSettled(ldaps.map(
      ldapConfig => authenticate(username, password, ldapConfig.configuration).then(ldapUser => ({ ldapUser, ldapConfig }))
    ))
      .then(results => {
        const successResults = results.filter(result => result.state === 'fulfilled')
                                      .map(result => result.value)
                                      .filter(value => !!value.ldapUser);

        if (successResults.length > 0) {
          return onSuccess(successResults);
        }

        const errorResults = results.filter(result => result.state !== 'fulfilled')
                                    .map(result => result.reason);

        onError(errorResults);
      });

    function onSuccess([{ ldapUser, ldapConfig }, ...otherResults]) {
      logger.debug(`Found user "${username}" in ${otherResults.length + 1} LDAP(s), select the first one: "${ldapConfig.name}"`);

      if (!ldapConfig.domainId) {
        logger.warn(`LDAP directory ${ldapConfig.name} does not have domain information, user provision could fail`);
      }

      findUserByEmail(username)
        .then(user => _updateOrProvisionUser(user, ldapUser, ldapConfig))
        .then(user => _saveUserProvisionedFields(user, ldapConfig))
        .then(result => done(null, result))
        .catch(error => {
          if (error) return done(error);

          done(null, false);
        });
    }

    function _updateOrProvisionUser(user, ldapUser, ldapConfig) {
      if (!user && !helpers.isLdapUsedForAutoProvisioning(ldapConfig)) {
        return Promise.reject();
      }

      const ldapPayload = {
            username,
            user: ldapUser,
            config: ldapConfig.configuration,
            domainId: ldapConfig.domainId
          },
          method = user ? updateUser : provisionUser,
          newUser = ldapModule.translate(user, ldapPayload);

      return method(newUser);
    }

    function _saveUserProvisionedFields(user, ldapConfig = {}) {
      const provisionFields = ldapConfig.configuration &&
                              ldapConfig.configuration.mapping &&
                              Object.keys(ldapConfig.configuration.mapping) || [];

      return metadata(user).set('profileProvisionedFields', provisionFields)
        .then(() => user);
    }

    function onError(errorResults) {
      if (errorResults.length > 0) {
        logger.error(`Error while authenticating user "${username}" against LDAP`, ...errorResults);
        done(errorResults[0]);
      } else {
        // no error means user not found
        logger.debug(`LDAP: Failed to authenticate user "${username}", user not found or invalid password`);
        done(null, false);
      }
    }

  });
};

function authenticate(username, password, configuration) {
  return q.denodeify(ldapModule.authenticate)(username, password, configuration);
}
