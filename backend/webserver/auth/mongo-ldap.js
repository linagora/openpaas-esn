'use strict';

const q = require('q');
const userModule = require('../../core/user');
const ldapModule = require('../../core/ldap');
const MongoLDAPStrategy = require('../../core/passport/ldap-mongo').Strategy;

module.exports = {
  name: 'mongo-ldap',
  strategy: new MongoLDAPStrategy({}, function(ldapPayload, done) {
    if (ldapPayload) {
      return provisionUser(ldapPayload)
        .then(function(user) {
          done(null, user);
        })
        .catch(done);
    }

    return done(new Error('Can not find user in LDAP'));
  })
};

function provisionUser(ldapPayload) {
  return q.nfcall(userModule.findByEmail, ldapPayload.username)
    .then(function(user) {
      if (user) { // user is already provisioned
        return user;
      }

      var provisionUser = ldapModule.translate(ldapPayload);

      return q.nfcall(userModule.provisionUser, provisionUser);
    });
}
