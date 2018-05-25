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
    var originalAddressbook;
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

          originalAddressbook = angular.copy(self.addressbook);

          self.publicRight = _getShareConcernedAddressbook(self.addressbook).rights.public;
          self.sharees = _getShareConcernedAddressbook(self.addressbook).sharees;
        });
    }

    function onSave() {
      var shareConcernedAddressbook = _getShareConcernedAddressbook(originalAddressbook);
      var updateActions = [];
      var publicRightChanged = self.publicRight !== shareConcernedAddressbook.rights.public;
      var shareeChanged = !angular.equals(self.sharees, shareConcernedAddressbook.sharees);

      if (publicRightChanged) {
        updateActions.push(contactAddressbookService.updateAddressbookPublicRight(shareConcernedAddressbook, self.publicRight));
      }

      if (shareeChanged) {
        updateActions.push(contactAddressbookService.shareAddressbook(shareConcernedAddressbook, self.sharees));
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

    function _getShareConcernedAddressbook(addressbook) {
      return addressbook.isSubscription ? addressbook.source : addressbook;
    }
  }
})(angular);
