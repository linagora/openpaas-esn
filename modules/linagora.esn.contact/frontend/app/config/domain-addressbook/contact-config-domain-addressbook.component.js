(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactConfigDomainAddressbook', {
      templateUrl: '/contact/app/config/domain-addressbook/contact-config-domain-addressbook.html',
      controller: 'ContactConfigDomainAddressbookController',
      require: {
        adminModulesDisplayerController: '^^adminModulesDisplayer'
      }
    });
})(angular);
