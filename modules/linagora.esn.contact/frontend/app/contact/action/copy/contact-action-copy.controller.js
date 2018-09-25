(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactActionCopyController', contactCopyController);

  function contactCopyController(
    _,
    asyncAction,
    contactAddressbookDisplayService,
    contactAddressbookService,
    contactService
  ) {
    var self = this;
    var NOTIFICATION_MESSAGES = {
      progressing: 'Copying contact...',
      success: 'Contact copied',
      failure: 'Failed to copy contact'
    };

    self.listPossibleDestinations = listPossibleDestinations;
    self.copyContact = copyContact;

    function listPossibleDestinations() {
      contactAddressbookService.listAddressbooksUserCanCreateContact()
        .then(_excludeCurrentAddressbook)
        .then(contactAddressbookDisplayService.convertShellsToDisplayShells)
        .then(function(availableAddressbookDisplayShells) {
          self.availableAddressbookDisplayShells = availableAddressbookDisplayShells;
          self.selectedAddressbook = self.availableAddressbookDisplayShells[0].shell;
        });
    }

    function copyContact() {
      return asyncAction(NOTIFICATION_MESSAGES, function() {
        return contactService.copyContact(self.selectedAddressbook, self.contact);
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
