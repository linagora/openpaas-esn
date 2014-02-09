'use strict';

var LDAPStrategy = require('passport-ldaplng').Strategy;
var esnconfig = require('../../core/esn-config');

var defaultldap = {
  url: 'ldap://localhost:1389',
  adminDn: 'uid=admin,ou=passport-ldapauth',
  adminPassword: 'secret',
  searchBase: 'ou=passport-ldapauth',
  searchFilter: '(mail={{username}})'
};

module.exports = {
  name: 'ldap',
  strategy: new LDAPStrategy(function(done) {
    esnconfig('ldap').get(function(err, data) {
      if (err) {
        return done(err);
      }
      var options = {server: data || defaultldap};
      return done(null, options);
    });
  }, function(profile, done) {
    if (profile) {
      var user = {
        provider: 'ldap',
        id: profile.uid,
        displayName: profile.cn || profile.displayName,
        name: {
          familyName: profile.sn,
          givenName: profile.givenName,
          middleName: profile.givenName
        }
      };
      var emails = [];
      if (profile.mail) {
        emails.push({value: profile.mail, type: 'work'});
      }
      user.emails = emails;
      return done(null, user);
    } else {
      return done(new Error('Can not find user in LDAP'));
    }
  })
};
