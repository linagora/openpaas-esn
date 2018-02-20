'use strict';

module.exports = {
  isLdapUsedForAuth,
  isLdapUsedForSearch,
  isLdapUsedForAutoProvisioning
};

function isLdapUsedForAuth(ldapConfig) {
  return ldapConfig && ldapConfig.usage && ldapConfig.usage.auth;
}

function isLdapUsedForSearch(ldapConfig) {
  return ldapConfig && ldapConfig.usage && ldapConfig.usage.search;
}

function _isAutoProvisioningHandledAndActivated(ldapConfig) {
  if (ldapConfig.usage.autoProvisioning !== undefined) {
    return ldapConfig.usage.autoProvisioning;
  }
  return true;
}

function isLdapUsedForAutoProvisioning(ldapConfig) {
  return (ldapConfig && ldapConfig.usage && _isAutoProvisioningHandledAndActivated(ldapConfig));
}
