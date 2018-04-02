'use strict';

angular.module('linagora.esn.contact')
  .factory('ContactsHelper', function($filter, esnDatetimeService, contactAddressbookDisplayService, CONTACT_ATTRIBUTES_ORDER) {

    function notNullNorEmpty(value) {
      return value && value.length > 0;
    }

    function getValue(element) {
      return (element && element.value) ? element.value : null;
    }

    function getOrderedValues(array, priorities) {
      if (!array || !array.length) {
        return [];
      }

      function getElementsFromType(type) {
        return array.filter(function(element) {
          return notNullNorEmpty(element.type) && element.type.toLowerCase() === type.toLowerCase();
        }) || [];
      }

      if (!notNullNorEmpty(priorities)) {
        return array;
      }

      var result = [];

      priorities.forEach(function(priority) {
        getElementsFromType(priority).forEach(function(element) {
          var v = getValue(element);

          if (v) {
            result.push({type: priority, value: v});
          }
        });
      });

      return result;
    }

    function getValueFromArray(array, priorities) {

      var result = getOrderedValues(array, priorities);

      if (notNullNorEmpty(result)) {
        return result[0].value;
      }

      // return first non null value;
      var filter = array.filter(function(element) {
        return getValue(element) !== null;
      });

      if (notNullNorEmpty(filter)) {
        return getValue(filter[0]);
      }
    }

    function getFormattedAddress(address) {
      var result = '';

      if (!address) {
        return result;
      }
      if (address.street) {
        result += address.street;
        result += ' ';
      }
      if (address.city) {
        result += address.city;
        result += ' ';
      }
      if (address.zip) {
        result += address.zip;
        result += ' ';
      }
      if (address.country) {
        result += address.country;
      }

      return result.trim();
    }

    function getFormattedName(contact) {

      if (notNullNorEmpty(contact.firstName) && notNullNorEmpty(contact.lastName)) {
        return contact.firstName + ' ' + contact.lastName;
      }

      if (notNullNorEmpty(contact.firstName)) {
        return contact.firstName;
      }

      if (notNullNorEmpty(contact.lastName)) {
        return contact.lastName;
      }

      if (notNullNorEmpty(contact.orgName)) {
        return contact.orgName;
      }

      if (notNullNorEmpty(contact.orgRole)) {
        return contact.orgRole;
      }

      if (notNullNorEmpty(contact.nickname)) {
        return contact.nickname;
      }

      if (notNullNorEmpty(contact.emails)) {
        var email = getValueFromArray(contact.emails, ['work', 'home', 'other']);

        if (email) {
          return email;
        }
      }

      if (notNullNorEmpty(contact.social)) {
        var social = getValueFromArray(contact.social, ['twitter', 'skype', 'google', 'linkedin', 'facebook']);

        if (social) {
          return social;
        }
      }

      if (notNullNorEmpty(contact.urls)) {
        return contact.urls[0].value;
      }

      if (notNullNorEmpty(contact.tel)) {
        var tel = getValueFromArray(contact.tel, ['work', 'mobile', 'home']);

        if (tel) {
          return tel;
        }
      }

      if (notNullNorEmpty(contact.notes)) {
        return contact.notes;
      }

      if (notNullNorEmpty(contact.tags) && contact.tags[0] && contact.tags[0].text) {
        return contact.tags[0].text;
      }

      if (contact.birthday) {
        return esnDatetimeService.formatMediumDate(contact.birthday);
      }

      if (notNullNorEmpty(contact.addresses)) {
        return getFormattedAddress(contact.addresses[0]);
      }

    }

    function orderData(contact) {
      if (!contact) {
        return;
      }
      contact.emails = getOrderedValues(contact.emails, CONTACT_ATTRIBUTES_ORDER.email);
      contact.tel = getOrderedValues(contact.tel, CONTACT_ATTRIBUTES_ORDER.phone);
    }

    function fillScopeContactData($scope, contact) {
      if (!contact) {
        return;
      }
      $scope.contact = contact;
      $scope.emails = getOrderedValues($scope.contact.emails, CONTACT_ATTRIBUTES_ORDER.email);
      $scope.phones = getOrderedValues($scope.contact.tel, CONTACT_ATTRIBUTES_ORDER.phone);
      $scope.formattedBirthday = esnDatetimeService.formatMediumDate(contact.birthday);
      $scope.addressbookDisplayShell = contactAddressbookDisplayService.convertShellToDisplayShell(contact.addressbook);
    }

    function getOrderType($scope) {
      var type = CONTACT_ATTRIBUTES_ORDER.social;

      for (var j = type.length; j--;) {
        if (type[j] === 'Other') {
          type.splice(j, 1);
        }
      }
      $scope.socialTypeOrder = type;
    }

    return {
      getFormattedName: getFormattedName,
      getFormattedAddress: getFormattedAddress,
      getOrderedValues: getOrderedValues,
      orderData: orderData,
      fillScopeContactData: fillScopeContactData,
      getOrderType: getOrderType
    };
  })
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
