(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactAddressbookCreateController', ContactAddressbookCreateController);

  function ContactAddressbookCreateController(asyncAction, contactAddressbookService) {
    var self = this;
    var notificationMessages = {
      progressing: 'Creating address book...',
      success: 'Address book created',
      failure: 'Failed to create address book'
    };

    self.onCreateBtnClick = onCreateBtnClick;

    function onCreateBtnClick() {
      return asyncAction(notificationMessages, function() {
        return contactAddressbookService.createAddressbook(self.addressbook);
      });
    }
  }
})(angular);
