(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactSidebarController', ContactSidebarController);

  function ContactSidebarController(
    $scope,
    _,
    contactAddressbookDisplayService,
    contactAddressbookService,
    CONTACT_ADDRESSBOOK_EVENTS
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      contactAddressbookService.listAddressbooks().then(function(addresssbookShells) {
        var addressbookDisplayShells = contactAddressbookDisplayService.convertShellsToDisplayShells(addresssbookShells);

        self.addressbooks = contactAddressbookDisplayService.sortAddressbookDisplayShells(addressbookDisplayShells);
      });

      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.CREATED, function(event, createdAddressbook) {
        _onAddressbookCreated(createdAddressbook);
      });
    }

    function _onAddressbookCreated(createdAddressbook) {
      self.addressbooks.push(contactAddressbookDisplayService.convertShellToDisplayShell(createdAddressbook));
      self.addressbooks = contactAddressbookDisplayService.sortAddressbookDisplayShells(self.addressbooks);
    }
  }
})(angular);
