(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookDisplayShellRegistry', contactAddressbookDisplayShellRegistry);

  function contactAddressbookDisplayShellRegistry(esnRegistry) {
    return esnRegistry('contactAddressbookDisplayShellRegistry', {
      primaryKey: 'id'
    });
  }
})(angular);
