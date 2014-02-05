'use strict';

var LDAPStrategy = require('passport-ldapauth').Strategy;
var config = require('../../core').config('default');

var defaultldap = {
  url: 'ldap://localhost:389',
  adminDn: 'uid=admin,ou=users,dc=linagora.com,dc=lng',
  adminPassword: 'secret',
  searchBase: 'ou=users,dc=linagora.com,dc=lng',
  searchFilter: '(uid={{username}})'
};

var options = (config.auth && config.auth.ldap) ? config.auth.ldap : defaultldap;

module.exports = {
  name: 'ldap',
  strategy: new LDAPStrategy({server: options}, function(profile, done) {
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
