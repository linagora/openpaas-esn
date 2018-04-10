(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedConfigurationItemController', contactAddressbookSharedConfigurationItemController);

  function contactAddressbookSharedConfigurationItemController(
    contactAddressbookDisplayService
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.addressbookDisplayName = contactAddressbookDisplayService.buildDisplayName(self.addressbook);
    }
  }
})(angular);
