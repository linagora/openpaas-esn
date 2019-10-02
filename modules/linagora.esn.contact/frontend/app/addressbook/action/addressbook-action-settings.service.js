(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookActionSettings', contactAddressbookActionSettings);

  function contactAddressbookActionSettings($state) {
    var action = {
      name: 'Settings',
      icon: 'settings',
      when: function() {
        return true;
      },
      execute: _goToSettingsPage
    };

    return action;

    function _goToSettingsPage(addressbook) {
      $state.go('contact.addressbooks.settings', {
        bookId: addressbook.bookId,
        bookName: addressbook.bookName
      });
    }
  }
})(angular);
