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

    /**
     * Go to creating contact page
     * @param {String} bookId
     * @param {String} bookName
     * @param {Boolean} shouldReplaceState  If set to true, the new state will replace previous state.
     */
    function newContact(bookId, bookName, shouldReplaceState) {
      if (shouldReplaceState) {
        return $location.url('/contact/new/' + bookId + '/' + bookName).replace();
      }

      $location.url('/contact/new/' + bookId + '/' + bookName);
    }
  }
})(angular);
