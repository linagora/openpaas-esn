(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactAddressbookEditController', ContactAddressbookEditController);

  function ContactAddressbookEditController(
    addressbook,
    asyncAction,
    contactAddressbookService
  ) {
    var self = this;
    var NOTFICATION_MESSAGES = {
      progressing: 'Updating address book...',
      success: 'Address book updated',
      failure: 'Failed to update address book'
    };

    self.addressbook = addressbook;
    self.onSaveBtnClick = onSaveBtnClick;

    function onSaveBtnClick() {
      return asyncAction(NOTFICATION_MESSAGES, _updateAddressbook);
    }

    function _updateAddressbook() {
      return contactAddressbookService.updateAddressbook(self.addressbook);
    }
  }
})(angular);
