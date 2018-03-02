(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactSidebarController', ContactSidebarController);

  function ContactSidebarController(
    contactAddressbookDisplayService,
    contactAddressbookService
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      contactAddressbookService.listAddressbooks().then(function(addresssbooks) {
        self.addressbooks = contactAddressbookDisplayService.buildAddressbookDisplayShells(addresssbooks);
      });
    }
  }
})(angular);
