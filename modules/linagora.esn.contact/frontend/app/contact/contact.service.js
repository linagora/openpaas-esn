(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactService', contactService);

  function contactService(
      $rootScope,
      session,
      ContactAPIClient
    ) {
      return {
        copyContact: copyContact,
        moveContact: moveContact
      };

      function copyContact(destinationAddressbookName, contact) {
        delete contact.id; // To generate new id for new contact, check out contactAPIClient

        return ContactAPIClient
          .addressbookHome(session.user._id)
          .addressbook(destinationAddressbookName)
          .vcard()
          .create(contact);
      }

      function moveContact(destinationAddressbookName, contact) {
        return ContactAPIClient
          .addressbookHome(session.user._id)
          .addressbook(contact.addressbook.bookName)
          .vcard(contact.id)
          .move({
            destAddressbook: destinationAddressbookName
          });
      }
    }
})(angular);
