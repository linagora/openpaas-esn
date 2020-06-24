(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactShowController', ContactShowController);

  function ContactShowController(
    $log,
    $scope,
    $state,
    $timeout,
    $stateParams,
    $window,
    ContactsHelper,
    contactUpdateDataService,
    ContactShellDisplayBuilder,
    deleteContact,
    sharedContactDataService,
    contactDisplayError,
    gracePeriodService,
    contactService,
    CONTACT_AVATAR_SIZE,
    CONTACT_EVENTS
  ) {
    $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = $stateParams.bookName;
    $scope.cardId = $stateParams.cardId;
    $scope.contact = {};
    $scope.loaded = false;

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if (data.id === $scope.cardId && data.addressbook && data.addressbook.bookName !== $scope.bookName) {
        $state.go('contact.addressbooks.show', {
          bookId: $scope.bookId,
          bookName: data.addressbook.bookName,
          cardId: data.id
        }, { location: 'replace' });
      }
    });

    $scope.$on(CONTACT_EVENTS.DELETED, function(event, data) {
      if (data.id === $scope.cardId) {
        $state.go('contact.addressbooks', {
          bookId: $scope.bookId,
          bookName: data.addressbook.bookName
        }, { location: 'replace' });
      }
    });

    function isAddressFilled(type) {
      if (!$scope.contact.addresses || !$scope.contact.addresses.length) {
        return false;
      }

      return $scope.contact.addresses.filter(function(address) {
        return address.type && typeof address.type.toLowerCase === 'function' && address.type.toLowerCase() === type.toLowerCase();
      }).length;
    }

    $scope.fillContactData = function(contact) {
      ContactsHelper.fillScopeContactData($scope, contact);
      $scope.displayShell = ContactShellDisplayBuilder.build(contact);
    };

    $scope.getAddress = function(type) {
      return $scope.contact.addresses.filter(function(address) {
        return address.type && typeof address.type.toLowerCase === 'function' && address.type.toLowerCase() === type.toLowerCase();
      })[0];
    };

    $scope.edit = function() {
      $state.go('contact.addressbooks.edit', {
        bookId: $scope.bookId,
        bookName: $scope.bookName,
        cardId: $scope.cardId
      }, { location: 'replace' });
    };

    $scope.deleteContact = function() {
      $timeout(function() {
        deleteContact($scope.bookId, $scope.bookName, $scope.contact);
      }, 200);
    };

    $scope.shouldDisplayWork = function() {
      return !!($scope.contact.orgName || $scope.contact.orgRole || isAddressFilled('work'));
    };

    $scope.shouldDisplayHome = function() {
      return !!(isAddressFilled('home') || $scope.formattedBirthday || $scope.contact.nickname);
    };

    $scope.shouldDisplayOthers = function() {
      return !!(isAddressFilled('other') || ($scope.contact.tags && $scope.contact.tags.length) || $scope.contact.notes || ($scope.contact.urls && $scope.contact.urls.length));
    };

    $scope.openAddressbook = function() {
      $state.go('contact.addressbooks', {
        bookId: $scope.contact.addressbook.bookId,
        bookName: $scope.contact.addressbook.bookName
      });
    };

    if (contactUpdateDataService.contact) {

      $scope.fillContactData(contactUpdateDataService.contact);

      $scope.$on('$stateChangeStart', function(evt, next, nextParams) {
        gracePeriodService.flush(contactUpdateDataService.taskId);
        // check if the user edit the contact again
        if (next && next.name && nextParams &&
            next.name === 'contact.addressbooks.edit' &&
            nextParams.bookId === $scope.bookId &&
            nextParams.bookName === $scope.bookName &&
            nextParams.cardId === $scope.cardId) {
          // cache the contact to show in editContactController
          contactUpdateDataService.contact = $scope.contact;
        } else {
          contactUpdateDataService.contact = null;
        }
      });

      $scope.$on(CONTACT_EVENTS.CANCEL_UPDATE, function(evt, data) {
        if (data.id === $scope.cardId) {
          $scope.contact = data;
        }
      });

      $window.addEventListener('beforeunload', function() {
        gracePeriodService.flush(contactUpdateDataService.taskId);
      });

      $scope.loaded = true;
    } else {
      contactService.getContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.cardId)
        .then($scope.fillContactData, function(err) {
          $log.debug('Error while loading contact', err);
          $scope.error = true;
          contactDisplayError('Cannot get contact details');
        })
        .finally(function() {
          $scope.loaded = true;
        });
    }

    sharedContactDataService.contact = {};
  }
})(angular);
