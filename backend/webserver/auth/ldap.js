'use strict';

var LDAPStrategy = require('passport-ldaplng').Strategy;
var esnconfig = require('../../core/esn-config');
var ldaputils = require('../../core/auth/ldap');


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
      return done(null, ldaputils.translate(profile));
    } else {
      console.log('No user');
      return done(new Error('Can not find user in LDAP'));
    }
  })
};
