(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactService', contactService);

  function contactService(
      $q,
      ContactAPIClient,
      AddressbookShell
    ) {
      return {
        listContacts: listContacts,
        getContact: getContact,
        createContact: createContact,
        copyContact: copyContact,
        moveContact: moveContact,
        removeContact: removeContact,
        updateContact: updateContact
      };

      function listContacts(addressbook, options) {
        return _getAddressbookShell(addressbook).then(function(addressbookShell) {
          var sourceMetadata = _getSouceMetadata(addressbookShell);

          return ContactAPIClient
            .addressbookHome(sourceMetadata.bookId)
            .addressbook(sourceMetadata.bookName)
            .vcard()
            .list(options)
            .then(function(result) {
              result.data.forEach(function(contact) {
                contact.addressbook = addressbookShell;
              });

              return result;
            });
        });
      }

      function getContact(addressbook, cardId) {
        return _getAddressbookShell(addressbook).then(function(addressbookShell) {
          var sourceMetadata = _getSouceMetadata(addressbookShell);

          return ContactAPIClient
            .addressbookHome(sourceMetadata.bookId)
            .addressbook(sourceMetadata.bookName)
            .vcard(cardId)
            .get()
            .then(function(contact) {
              contact.addressbook = addressbookShell;

              return contact;
            });
        });
      }

      function createContact(addressbook, contact) {
        return _getAddressbookShell(addressbook).then(function(addressbookShell) {
          var sourceMetadata = _getSouceMetadata(addressbookShell);

          return ContactAPIClient
            .addressbookHome(sourceMetadata.bookId)
            .addressbook(sourceMetadata.bookName)
            .vcard()
            .create(contact);
        });
      }

      function updateContact(addressbook, contact) {
        return _getAddressbookShell(addressbook).then(function(addressbookShell) {
          var sourceMetadata = _getSouceMetadata(addressbookShell);

          return ContactAPIClient
            .addressbookHome(sourceMetadata.bookId)
            .addressbook(sourceMetadata.bookName)
            .vcard(contact.id)
            .update(contact);
        });
      }

      function removeContact(addressbook, contact, options) {
        return _getAddressbookShell(addressbook).then(function(addressbookShell) {
          var sourceMetadata = _getSouceMetadata(addressbookShell);

          return ContactAPIClient
            .addressbookHome(sourceMetadata.bookId)
            .addressbook(sourceMetadata.bookName)
            .vcard(contact.id)
            .remove(options);
        });
      }

      function copyContact(toAddressbook, contact) {
        return _getAddressbookShell(toAddressbook).then(function(addressbookShell) {
          var sourceMetadata = _getSouceMetadata(addressbookShell);

          contact = angular.copy(contact);
          delete contact.id; // To generate new id for new contact, check out contactAPIClient

          return ContactAPIClient
            .addressbookHome(sourceMetadata.bookId)
            .addressbook(sourceMetadata.bookName)
            .vcard()
            .create(contact);
        });
      }

      function moveContact(fromAddressbook, toAddressbook, contact) {
        var fromMetadata, toMetadata;

        return $q.all([
          _getAddressbookShell(fromAddressbook),
          _getAddressbookShell(toAddressbook)
        ]).then(function(addressbookShells) {
          fromMetadata = _getSouceMetadata(addressbookShells[0]);
          toMetadata = _getSouceMetadata(addressbookShells[1]);

          return ContactAPIClient
            .addressbookHome(fromMetadata.bookId)
            .addressbook(fromMetadata.bookName)
            .vcard(contact.id)
            .move({
              toBookId: toMetadata.bookId,
              toBookName: toMetadata.bookName
            });
        });
      }

      function _getSouceMetadata(addressbookShell) {
        var bookName, bookId;

        bookName = addressbookShell.isSubscription ? addressbookShell.source.bookName : addressbookShell.bookName;
        bookId = addressbookShell.isSubscription ? addressbookShell.source.bookId : addressbookShell.bookId;

        return {
          bookId: bookId,
          bookName: bookName
        };
      }

      function _getAddressbookShell(addressbook) {
        if (addressbook instanceof AddressbookShell) {
          return $q.when(addressbook);
        }

        return ContactAPIClient
          .addressbookHome(addressbook.bookId)
          .addressbook(addressbook.bookName)
          .get();
      }
    }
})(angular);
