'use strict';

angular.module('linagora.esn.contact')

  .factory('closeContactForm', function($state) {
    return function() {
      $state.go('/contact');
    };
  })

  .factory('openContactForm', function(sharedContactDataService, ContactLocationHelper) {
    return function(bookId, contact) {
      if (contact) {
        sharedContactDataService.contact = contact;
      }
      ContactLocationHelper.contact.new(bookId);
    };
  });
