'use strict';

angular.module('linagora.esn.admin')

.controller('adminDavController', function($stateParams, adminDomainConfigService, asyncAction) {
  var self = this;
  var domainId = $stateParams.domainId;
  var CONFIG_NAME = 'davserver';

  adminDomainConfigService.get(domainId, CONFIG_NAME)
    .then(function(data) {
      self.config = data;
    });

  self.save = function() {
    return asyncAction('Modification of DAV Server settings', _saveConfiguration);
  };

  function _saveConfiguration() {
    return adminDomainConfigService.set(domainId, {
      name: CONFIG_NAME,
      value: self.config
    });
  }
});
