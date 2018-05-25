(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('openContactForm', openContactForm);

  function openContactForm(sharedContactDataService, ContactLocationHelper) {
    return function(bookId, bookName, contact) {
      if (contact) {
        sharedContactDataService.contact = contact;
      }
      ContactLocationHelper.contact.new(bookId, bookName);
    };
  }
})(angular);
