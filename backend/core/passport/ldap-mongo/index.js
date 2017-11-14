'use strict';

const q = require('q'),
      userModule = require('../../user'),
      ldapModule = require('../../ldap'),
      logger = require('../../logger');

module.exports = (username, password, done) => {
  ldapModule.findLDAPForUser(username, (err, ldaps) => {
    if (err) {
      return done(null, false, { message: `LDAP is not configured for user ${username}. ${err}` });
    }

    if (!ldaps || ldaps.length === 0) {
      return done(null, false, { message: 'Can not find any LDAP for this user' });
    }

    q.allSettled(ldaps.map(
      ldapConfig => authenticate(username, password, ldapConfig.configuration).then(user => ({ user, ldapConfig }))
    ))
      .then(results => {
        const successResults = results.filter(result => result.state === 'fulfilled')
                                      .map(result => result.value)
                                      .filter(value => !!value.user);

        if (successResults.length > 0) {
          return onSuccess(successResults);
        }

        const errorResults = results.filter(result => result.state !== 'fulfilled')
                                    .map(result => result.reason);

        onError(errorResults);
      });

    function onSuccess(successResults) {
      const { user, ldapConfig } = successResults[0];

      logger.debug(`Found user "${username}" in ${successResults.length} LDAP(s), select the first one: "${ldapConfig.name}"`);

      if (!ldapConfig.domainId) {
        logger.warn(`LDAP directory ${ldapConfig.name} does not have domain information, user provision could fail`);
      }

      provisionUser({
        username,
        user,
        config: ldapConfig.configuration,
        domainId: ldapConfig.domainId
      })
        .then(user => done(null, user))
        .catch(done);
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

function provisionUser(ldapPayload) {
  return q.nfcall(userModule.findByEmail, ldapPayload.username)
    .then(user => {
      var method = user ? 'update' : 'provisionUser',
          provisionUser = ldapModule.translate(user, ldapPayload);

      return q.ninvoke(userModule, method, provisionUser);
    });
}
