(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactActionMoveController', contactActionMoveController);

  function contactActionMoveController(
    _,
    asyncAction,
    contactAddressbookDisplayService,
    contactAddressbookService,
    contactService
  ) {
    var self = this;
    var NOTIFICATION_MESSAGES = {
      progressing: 'Moving contact...',
      success: 'Contact moved',
      failure: 'Failed to move contact'
    };

    self.listPossbileDestinations = listPossbileDestinations;
    self.moveContact = moveContact;

    function listPossbileDestinations() {
      contactAddressbookService.listAddressbooksUserCanCreateContact()
        .then(_excludeCurrentAddressbook)
        .then(contactAddressbookDisplayService.convertShellsToDisplayShells)
        .then(function(availableAddressbookDisplayShells) {
          self.availableAddressbookDisplayShells = availableAddressbookDisplayShells;
          self.selectedAddressbook = self.availableAddressbookDisplayShells[0].shell;
        });
    }

    function moveContact() {
      return asyncAction(NOTIFICATION_MESSAGES, function() {
        return contactService.moveContact(self.contact.addressbook, self.selectedAddressbook, self.contact);
      });
    }

    function _excludeCurrentAddressbook(addressbooks) {
      _.remove(addressbooks, function(addressbook) {
        return self.contact.addressbook.bookName === addressbook.bookName;
      });

      return addressbooks;
    }
  }
})(angular);
