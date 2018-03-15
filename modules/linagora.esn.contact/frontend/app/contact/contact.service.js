(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactService', contactService);

  function contactService(
      session,
      ContactAPIClient
    ) {
      return {
        copyContact: copyContact
      };

      function copyContact(bookName, contact) {
        delete contact.id; // To generate new id for new contact, check out contactAPIClient

        return ContactAPIClient
          .addressbookHome(session.user._id)
          .addressbook(bookName)
          .vcard()
          .create(contact);
      }
    }
})(angular);
