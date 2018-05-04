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
      if (self.addressbook.isShared) {
        self.addressbookDisplayName = contactAddressbookDisplayService.buildDisplayName(self.addressbook.source);
      } else {
        self.addressbookDisplayName = contactAddressbookDisplayService.buildDisplayName(self.addressbook);
      }
    }
  }
})(angular);
