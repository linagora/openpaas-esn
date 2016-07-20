'use strict';

angular.module('linagora.esn.admin')

.controller('adminLdapController', function($stateParams, adminDomainConfigService, asyncAction) {
  var self = this;
  var domainId = $stateParams.domainId;
  var CONFIG_NAME = 'ldap';

  adminDomainConfigService.get(domainId, CONFIG_NAME)
    .then(function(data) {
      self.config = data;
    });

  self.save = function() {
    return asyncAction('Modification of LDAP Server settings', _saveConfiguration);
  };

  function _saveConfiguration() {
    return adminDomainConfigService.set(domainId, {
      name: CONFIG_NAME,
      value: self.config
    });
  }
});
