'use strict';

var LDAPStrategy = require('passport-ldaplng').Strategy;
var esnconfig = require('../../core/esn-config');

var defaultldap = {
  url: 'ldap://localhost:1389',
  adminDn: 'uid=admin,ou=passport-ldapauth',
  adminPassword: 'secret',
  searchBase: 'ou=passport-ldapauth',
  searchFilter: '(uid={{username}})'
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
        username: profile.uid,
        email: profile.mail || profile.email ||  profile.mailBox ||  profile.mailAlias,
        name: profile.cn
      };
      return done(null, user);
    } else {
      return done(new Error('Can not find user in LDAP'));
    }
  })
};
