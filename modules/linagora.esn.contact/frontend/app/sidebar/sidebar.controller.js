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
    var DISPLAY_SHELL_CONVERT_OPTIONS = {
      includeActions: true,
      includePriority: true
    };

    self.$onInit = $onInit;

    function $onInit() {
      contactAddressbookService.listAddressbooks().then(function(addresssbookShells) {
        var addressbookDisplayShells = contactAddressbookDisplayService.convertShellsToDisplayShells(addresssbookShells, DISPLAY_SHELL_CONVERT_OPTIONS);

        self.addressbooks = contactAddressbookDisplayService.sortAddressbookDisplayShells(addressbookDisplayShells);
      });

      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.CREATED, function(event, createdAddressbook) {
        _onAddressbookCreated(createdAddressbook);
      });

      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, function(event, newAddressbook) {
        _onUpdatedAddressbook(newAddressbook);
      });

      $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.DELETED, function(event, removedAddressbook) {
        _onRemovedAddressbook(removedAddressbook);
      });
    }

    function _onAddressbookCreated(createdAddressbook) {
      self.addressbooks.push(contactAddressbookDisplayService.convertShellToDisplayShell(createdAddressbook, DISPLAY_SHELL_CONVERT_OPTIONS));
      self.addressbooks = contactAddressbookDisplayService.sortAddressbookDisplayShells(self.addressbooks);
    }

    function _onUpdatedAddressbook(newAddressbook) {
      var index = _.findIndex(self.addressbooks, function(addressbook) {
        return addressbook.shell.bookName === newAddressbook.bookName;
      });

      self.addressbooks[index].shell = newAddressbook;
      self.addressbooks[index].displayName = newAddressbook.name;
    }

    function _onRemovedAddressbook(removedAddressbook) {
      _.remove(self.addressbooks, function(addressbook) {
        return addressbook.shell.bookName === removedAddressbook;
      });
    }
  }
})(angular);
