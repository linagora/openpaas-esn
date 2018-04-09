(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactsHelper', ContactsHelper);

  function ContactsHelper(
      $filter,
      esnDatetimeService,
      contactAddressbookDisplayService,
      CONTACT_ATTRIBUTES_ORDER
  ) {
    return {
      getFormattedName: getFormattedName,
      getFormattedAddress: getFormattedAddress,
      getOrderedValues: getOrderedValues,
      orderData: orderData,
      fillScopeContactData: fillScopeContactData,
      getOrderType: getOrderType
    };

    function notNullNorEmpty(value) {
      return value && value.length > 0;
    }

    function getValue(element) {
      return (element && element.value) ? element.value : null;
    }

    function getOrderedValues(array, priorities) {
      if (!notNullNorEmpty(array)) {
        return [];
      }

      function getElementsFromType(type) {
        return array.filter(function(element) {
          return notNullNorEmpty(element.type) && element.type.toLowerCase() === type.toLowerCase();
        });
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
  }
})(angular);
