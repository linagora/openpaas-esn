(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSettingsController', contactAddressbookSettingsController);

  function contactAddressbookSettingsController(
    $q,
    $state,
    $stateParams,
    asyncAction,
    contactAddressbookService,
    contactAddressbookDisplayService
  ) {
    var self = this;
    var oldAddressbook = {};
    var NOTIFICATION_MESSAGES = {
      progressing: 'Updating address book settings...',
      success: 'Address book settings are updated',
      failure: 'Failed to update address book settings'
    };

    self.$onInit = $onInit;
    self.onSave = onSave;
    self.onCancel = onCancel;

    function $onInit() {
      contactAddressbookService.getAddressbookByBookName($stateParams.bookName)
        .then(function(addressbook) {
          self.addressbook = addressbook;
          self.addressbookDisplayName = contactAddressbookDisplayService.buildDisplayName(addressbook);

          if (addressbook.isSubscription) {
            self.publicRight = addressbook.source.rights.public;
            self.sharees = addressbook.source.sharees;
          } else {
            self.publicRight = addressbook.rights.public;
            self.sharees = addressbook.sharees;
          }
          angular.copy(self.addressbook, oldAddressbook);
        });
    }

    function onSave() {
      var updateActions = [];
      var publicRightChanged = self.publicRight !== oldAddressbook.rights.public;
      var shareeChanged = !angular.equals(self.sharees, oldAddressbook.sharees);

      if (publicRightChanged) {
        updateActions.push(contactAddressbookService.updateAddressbookPublicRight(self.addressbook, self.publicRight));
      }

      if (shareeChanged) {
        updateActions.push(contactAddressbookService.shareAddressbook(self.addressbook, self.sharees));
      }

      return asyncAction(NOTIFICATION_MESSAGES, function() {
        return $q.all(updateActions).then(function() {
          $state.go('contact.addressbooks', {
            bookName: self.addressbook.bookName
          }, { location: 'replace' });
        });
      });
    }

    function onCancel() {
      $state.go('contact.addressbooks', {
        bookName: self.addressbook.bookName
      }, { location: 'replace' });
    }
  }
})(angular);
