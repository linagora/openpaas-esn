(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSharedConfigurationController', contactAddressbookSharedConfigurationController);

  function contactAddressbookSharedConfigurationController(
    $log,
    _,
    asyncAction,
    session,
    contactAddressbookService,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT,
    CONTACT_SHARING_SHARE_ACCESS_CHOICES
  ) {
    var self = this;
    var NOTIFICATION_MESSAGES = {
      progressing: 'Adding shared address book...',
      success: 'Successfully added shared address book',
      failure: 'Can not add shared address book'
    };

    self.addressbooksPerUser = [];
    self.selectedUsers = [];
    self.onAddingUser = onAddingUser;
    self.onUserAdded = onUserAdded;
    self.onUserRemoved = onUserRemoved;
    self.subscribe = subscribe;
    self.getSelectedAddressbooks = getSelectedAddressbooks;

    function onAddingUser($tags) {
      return !!$tags._id;
    }

    function onUserAdded(user) {
      contactAddressbookService.listSubscribableAddressbooks(user._id)
        .then(function(addressbooks) {
          return addressbooks.map(function(addressbook) {
            addressbook.user = user;

            return addressbook;
          });
        })
        .then(_filterSubscribedAddressbooks)
        .then(_filterDuplicates)
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

    function _filterDuplicates(addressbooks) {
      return addressbooks.reduce(function(uniqueAddressbooksList, currentAddressbook) {
          var duplicateIndex = _.findIndex(uniqueAddressbooksList, function(addresssBookListItem) {
            return _isSharedFromSameAddressBook(addresssBookListItem, currentAddressbook);
          });

          if (duplicateIndex >= 0) {
            if (_comparePermission(currentAddressbook, uniqueAddressbooksList[duplicateIndex])) {
              uniqueAddressbooksList.splice(duplicateIndex, 1, currentAddressbook);
            }
          } else {
            uniqueAddressbooksList.push(currentAddressbook);
          }

          return uniqueAddressbooksList;
        },
        []
      );
    }

    function _comparePermission(addressbook1, addressbook2) {
      var score1 = _getPermissionScore(addressbook1);
      var score2 = _getPermissionScore(addressbook2);

      if (score1 === score2) {
        // we prefer to subscribe to delegated address book
        return addressbook1.isSubscription ? 1 : -1;
      }

      return score1 > score2;
    }

    function _getPermissionScore(addressbook) {
      var access;

      if (addressbook.isSubscription) {
        access = _.find(CONTACT_SHARING_SHARE_ACCESS_CHOICES, { value: addressbook.shareAccess });
      } else {
        access = _.find(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT, { value: addressbook.rights.public });
      }

      return access ? access.score : 0;
    }

    function _isSharedFromSameAddressBook(addressbook1, addressbook2) {
      if (addressbook1.isSubscription) {
        addressbook1 = addressbook1.source;
      }

      if (addressbook2.isSubscription) {
        addressbook2 = addressbook2.source;
      }

      return _isAddressbookEqual(addressbook1, addressbook2);
    }

    function _isAddressbookEqual(addressbook1, addressbook2) {
      return addressbook1.bookId === addressbook2.bookId && addressbook1.bookName === addressbook2.bookName;
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
