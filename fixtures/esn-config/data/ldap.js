'use strict';

module.exports = function() {
  return {
    url: 'ldap://localhost:1389',
    adminDn: 'uid=admin,ou=passport-ldapauth',
    adminPassword: 'secret',
    searchBase: 'ou=passport-ldapauth',
    searchFilter: '(uid={{username}})'
  };
};
