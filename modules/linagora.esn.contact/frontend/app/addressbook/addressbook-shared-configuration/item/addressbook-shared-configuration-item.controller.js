(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedConfigurationItemController', contactAddressbookSharedConfigurationItemController);

  function contactAddressbookSharedConfigurationItemController(
    contactAddressbookDisplayService,
    CONTACT_SHARING_SUBSCRIPTION_TYPE
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.addressbook.subscriptionType === CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation) {
        self.addressbookDisplayName = contactAddressbookDisplayService.buildDisplayName(self.addressbook.source);
      } else {
        self.addressbookDisplayName = contactAddressbookDisplayService.buildDisplayName(self.addressbook);
      }
    }
  }
})(angular);
