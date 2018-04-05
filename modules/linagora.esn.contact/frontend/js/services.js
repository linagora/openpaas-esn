'use strict';

angular.module('linagora.esn.contact')
  .factory('deleteContact', function(
                              $rootScope,
                              $q,
                              ContactAPIClient,
                              gracePeriodService,
                              notificationFactory,
                              esnI18nService,
                              GRACE_DELAY,
                              CONTACT_EVENTS) {
    return function(bookId, bookName, contact) {
      var options = { graceperiod: GRACE_DELAY };

      if (contact.etag) {
        options.etag = contact.etag;
      }

      return ContactAPIClient
        .addressbookHome(bookId)
        .addressbook(bookName)
        .vcard(contact.id)
        .remove(options)
        .then(function(taskId) {
          $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);

          return gracePeriodService.grace({
            id: taskId,
            performedAction: esnI18nService.translate('You have just deleted a contact (%s)', contact.displayName),
            cancelFailed: 'Cannot cancel contact deletion, the contact might be deleted permanently',
            cancelTooLate: 'It is too late to cancel the contact deletion, the contact might be deleted permanently'
          }).catch(function() {
            $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
          });
        }, function(err) {
          notificationFactory.weakError('Contact Delete', 'The contact cannot be deleted, please retry later');

          return $q.reject(err);
        });
    };
  })

  .factory('sharedContactDataService', function() {
    return {
      contact: {},
      searchQuery: null,
      categoryLetter: ''
    };
  })

  .factory('contactUpdateDataService', function() {
    return {
      taskId: null,
      contact: null,
      contactUpdatedIds: []
    };
  })

  .factory('sendContactToBackend', function($location, ContactsHelper, $q) {
    return function($scope, sendRequest) {
      if ($scope.calling) {
        return $q.reject('The form is already being submitted');
      }

      $scope.contact.displayName = ContactsHelper.getFormattedName($scope.contact);
      if (!$scope.contact.displayName) {
        return $q.reject('Please fill at least a field');
      }

      $scope.calling = true;

      return sendRequest().finally(function() {
        $scope.calling = false;
      });
    };
  })

  .factory('ContactLocationHelper', function($location) {

    function goHome() {
      $location.url('/contact');
    }

    function showContact(bookId, bookName, cardId) {
      $location.url('/contact/show/' + bookId + '/' + bookName + '/' + cardId);
    }

    function editContact(bookId, bookName, cardId) {
      $location.url('/contact/edit/' + bookId + '/' + bookName + '/' + cardId);
    }

    function newContact(bookId, bookName) {
      $location.url('/contact/new/' + bookId + '/' + bookName);
    }

    return {
      home: goHome,
      contact: {
        new: newContact,
        show: showContact,
        edit: editContact
      }
    };
  });
