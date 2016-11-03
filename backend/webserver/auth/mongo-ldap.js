'use strict';

const q = require('q');
const _ = require('lodash');
const userModule = require('../../core/user');
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
  var email = ldapPayload.username;

  return q.nfcall(userModule.findByEmail, email)
    .then(function(user) {
      if (user) { // user is already provisioned
        return user;
      }

      user = translate(ldapPayload);

      return q.nfcall(userModule.provisionUser, user);
    });
}

function translate(ldapPayload) {
  var email = ldapPayload.username;
  var ldapConfig = ldapPayload.config;
  var ldapUser = ldapPayload.user;
  var domainId = ldapPayload.domainId;
  var provision_user = {
    accounts: [{
      type: 'email',
      hosted: true,
      emails: [email]
    }],
    domains: [{
      domain_id: domainId
    }]
  };

  if (ldapConfig.configuration && ldapConfig.configuration.mapping) {
    _.forEach(ldapConfig.configuration.mapping, function(value, key) {
      if (key === 'email') {
        var email = ldapUser[value];

        if (provision_user.accounts[0].emails.indexOf(email) === -1) {
          provision_user.accounts[0].emails.push(email);
        }
      } else {
        provision_user[key] = ldapUser[value];
      }
    });
  }

  return provision_user;
}
