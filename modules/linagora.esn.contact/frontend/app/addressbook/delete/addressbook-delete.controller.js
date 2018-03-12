(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactAddressbookDeleteController', ContactAddressbookDeleteController);

  function ContactAddressbookDeleteController(
    addressbook,
    asyncAction,
    contactAddressbookService,
    contactAddressbookDisplayService
  ) {
    var self = this;
    var NOTFICATION_MESSAGES = {
      progressing: 'Deleting address book...',
      success: 'Address book deleted',
      failure: 'Failed to delete address book'
    };

    self.onDeleteBtnClick = onDeleteBtnClick;
    self.addressbookDisplayShell = contactAddressbookDisplayService.convertShellToDisplayShell(addressbook);

    function onDeleteBtnClick() {
      return asyncAction(NOTFICATION_MESSAGES, _removeAddressbook);
    }

    function _removeAddressbook() {
      return contactAddressbookService.removeAddressbook(addressbook);
    }
  }
})(angular);
