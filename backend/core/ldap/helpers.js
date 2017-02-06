'use strict';

module.exports = {
  isLdapUsedForAuth,
  isLdapUsedForSearch
};

function isLdapUsedForAuth(ldapConfig) {
  return ldapConfig && ldapConfig.usage && ldapConfig.usage.auth;
}

function isLdapUsedForSearch(ldapConfig) {
  return ldapConfig && ldapConfig.usage && ldapConfig.usage.search;
}
