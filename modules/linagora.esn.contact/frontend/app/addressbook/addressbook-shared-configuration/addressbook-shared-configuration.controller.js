(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedConfigurationController', contactAddressbookSharedConfigurationController);

  function contactAddressbookSharedConfigurationController(
    $log,
    _,
    asyncAction,
    contactAddressbookService
  ) {
    var self = this;
    var NOTIFICATION_MESSAGES = {
      progressing: 'Adding shared address book...',
      success: 'Successfully added shared address book',
      failure: 'Can not add shared address book'
    };

    self.addressbooksPerUser = [];
    self.selectedUsers = [];
    self.onUserAdded = onUserAdded;
    self.onUserRemoved = onUserRemoved;
    self.subscribe = subscribe;
    self.getSelectedAddressbooks = getSelectedAddressbooks;

    function onUserAdded(user) {
      contactAddressbookService.listSubscribableAddressbooks(user._id)
        .then(function(addressbooks) {
          return addressbooks.map(function(addressbook) {
            addressbook.user = user;

            return addressbook;
          });
        })
        .then(_filterSubscribedAddressbooks)
        .then(function(filteredAddressbooks) {
          self.addressbooksPerUser = self.addressbooksPerUser.concat(filteredAddressbooks);
        })
        .catch(function(err) {
          $log.error('Can not get shared address books for user', user._id, err);
        });
    }

    function onUserRemoved(user) {
      _.remove(self.addressbooksPerUser, function(addressbook) {
        return addressbook.user._id === user._id;
      });
    }

    function _filterSubscribedAddressbooks(userAddressbooks) {
      return contactAddressbookService.listSubscribedAddressbooks().then(filter);

      function filter(subscribedAddressbooks) {
        return userAddressbooks.filter(function(userAddressbook) {
          return !subscribedAddressbooks.some(function(subscribedAddressbook) {
            return userAddressbook.bookId === subscribedAddressbook.source.bookId && userAddressbook.bookName === subscribedAddressbook.source.bookName;
          });
        });
      }
    }

    function getSelectedAddressbooks() {
      return self.addressbooksPerUser.filter(function(addressbook) {
        return addressbook.isSelected;
      });
    }

    function subscribe() {
      var selectedAddressbooks = getSelectedAddressbooks();

      asyncAction(NOTIFICATION_MESSAGES, function() {
        return contactAddressbookService.subscribeAddressbooks(selectedAddressbooks);
      });
    }
  }
})(angular);
