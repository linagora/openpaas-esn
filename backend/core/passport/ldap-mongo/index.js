'use strict';

const q = require('q'),
      userModule = require('../../../core/user'),
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

    const ldapConfig = ldaps[0]; // authenticate user on the first LDAP for now

    ldapModule.authenticate(username, password, ldapConfig.configuration, (err, user) => {
      if (err) {
        // Invalid credentials / user not found are not errors but login failures
        if (err.name === 'InvalidCredentialsError' || err.name === 'NoSuchObjectError' || (typeof err === 'string' && err.match(/no such user/i))) {
          return done(null, false);
        }

        // Other errors are (most likely) real errors
        return done(err);
      }

      if (!user) {
        return done(false);
      }

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
    });
  });
};

function provisionUser(ldapPayload) {
  return q.nfcall(userModule.findByEmail, ldapPayload.username)
    .then(user => {
      var method = user ? 'update' : 'provisionUser',
          provisionUser = ldapModule.translate(user, ldapPayload);

      return q.ninvoke(userModule, method, provisionUser);
    });
}
