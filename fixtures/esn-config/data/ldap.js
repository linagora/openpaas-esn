'use strict';

module.exports = function() {
  return [{
    name: 'OpenPaas',
    configuration: {
      url: 'ldap://localhost:1389',
      adminDn: 'uid=admin,ou=passport-ldapauth',
      adminPassword: 'secret',
      searchBase: 'ou=passport-ldapauth',
      searchFilter: '(uid={{username}})'
    }
  }];
};
