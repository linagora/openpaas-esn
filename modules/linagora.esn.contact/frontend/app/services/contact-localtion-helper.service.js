(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactLocationHelper', ContactLocationHelper);

  function ContactLocationHelper($location) {

    return {
      home: goHome,
      contact: {
        new: newContact,
        show: showContact,
        edit: editContact
      }
    };

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
  }
})(angular);
