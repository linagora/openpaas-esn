'use strict';

angular.module('linagora.esn.contact')

  .factory('closeContactForm', function($state) {
    return function() {
      $state.go('/contact');
    };
  })

  .factory('openContactForm', function(sharedContactDataService, ContactLocationHelper, DEFAULT_ADDRESSBOOK_NAME) {
    return function(bookId, contact) {
      if (contact) {
        sharedContactDataService.contact = contact;
      }
      ContactLocationHelper.contact.new(bookId, DEFAULT_ADDRESSBOOK_NAME);
    };
  });
