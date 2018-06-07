(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .service('ContactShellBuilder', ContactShellBuilder);

  function ContactShellBuilder(
    $log,
    $q,
    ContactShell,
    ContactShellHelper,
    contactUpdateDataService,
    contactAvatarService,
    ICAL
  ) {

    this.setAddressbookCache = function(cache) {
      this.addressbookCache = cache;
    };

    this.fromVcard = function(vcard) {
      var contact = new ContactShell(new ICAL.Component(vcard));

      if (contactUpdateDataService.contactUpdatedIds.indexOf(contact.id) > -1) {
        contactAvatarService.forceReloadDefaultAvatar(contact);
      }

      return contact;
    };

    this.populateAddressbook = function(shell, bookId, bookName) {
      return this.addressbookCache.get({bookId: bookId, bookName: bookName}).then(function(ab) {
        shell.addressbook = ab;

        return shell;
      }, function() {
        return shell;
      });
    };

    this.fromWebSocket = function(data) {
      return this.populateAddressbook(this.fromVcard(data.vcard), data.bookId, data.bookName);
    };

    this.fromCardListResponse = function(response) {
      var self = this;

      if (response && response.data && response.data._embedded &&
        response.data._embedded['dav:item'] && response.data._embedded['dav:item'].length) {
        return $q.all(response.data._embedded['dav:item'].map(function(vcard) {
          var contactShell = self.fromVcard(vcard.data);
          var metadata = ContactShellHelper.getMetadata(vcard._links.self.href);

          var bookHome, bookName;

          if (metadata) {
            bookHome = metadata.bookId;
            bookName = metadata.bookName;
          }

          if (bookHome && bookName) {
            return self.populateAddressbook(contactShell, bookHome, bookName);
          }

          return contactShell;
        }));
      }

      return $q.when([]);
    };

    this.fromCardSearchResponse = function(response) {
      var self = this;

      if (response && response.data && response.data._embedded &&
        response.data._embedded['dav:item'] && response.data._embedded['dav:item'].length) {
        return $q.all(response.data._embedded['dav:item'].map(function(vcard) {
          if (!vcard || !vcard.data) {
            return;
          }

          var contactShell = self.fromVcard(vcard.data);
          var openpaasAddressbook = vcard['openpaas:addressbook']; // This field only available on search contacts in subscribed address books
          var bookHome, bookName;

          if (openpaasAddressbook) {
            bookHome = openpaasAddressbook.bookHome;
            bookName = openpaasAddressbook.bookName;
          } else {
            var metadata = ContactShellHelper.getMetadata(vcard._links.self.href);

            if (metadata) {
              bookHome = metadata.bookId;
              bookName = metadata.bookName;
            }
          }

          if (bookHome && bookName) {
            return self.populateAddressbook(contactShell, bookHome, bookName);
          }

          return contactShell;
        }).filter(Boolean));
      }

      return $q.when([]);
    };
  }
})(angular);
