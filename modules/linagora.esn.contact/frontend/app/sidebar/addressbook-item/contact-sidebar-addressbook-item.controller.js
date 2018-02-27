(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactSidebarAddressbookItemController', ContactSidebarAddressbookItemController);

  function ContactSidebarAddressbookItemController(contactAddressbookService) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.bookTitle = contactAddressbookService.getDisplayName(self.addressbook);
    }
  }
})(angular);
