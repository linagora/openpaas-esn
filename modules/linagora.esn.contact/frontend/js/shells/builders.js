'use strict';

angular.module('linagora.esn.contact')

  .run(function(AddressbookCache, ContactShellBuilder) {
    ContactShellBuilder.setAddressbookCache(AddressbookCache);
  })

  .factory('AddressbookCache', function($log, ContactAPIClient, Cache, CONTACT_ADDRESSBOOK_TTL) {
    return new Cache({
      loader: function(options) {
        $log.debug('Loading addressbook from cache', options);
        return ContactAPIClient.addressbookHome(options.bookId).addressbook(options.bookName).get();
      },
      keyBuilder: function(options) {
        return options.bookId + '-' + options.bookName;
      },
      ttl: CONTACT_ADDRESSBOOK_TTL
    });
  })

  .factory('ContactShellBuilder', function($log, $q, ContactShell, ICAL, ContactsHelper, ContactShellHelper, contactUpdateDataService) {

    this.setAddressbookCache = function(cache) {
      this.addressbookCache = cache;
    };

    this.buildContactShell = function(vcarddata) {
      var contact = new ContactShell(new ICAL.Component(vcarddata.data));
      if (contactUpdateDataService.contactUpdatedIds.indexOf(contact.id) > -1) {
        ContactsHelper.forceReloadDefaultAvatar(contact);
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

    this.populateShell = function(shell, href) {
      var metadata = ContactShellHelper.getMetadata(href);
      if (!metadata || !metadata.bookId || !metadata.bookName) {
        return $q.when(shell);
      }
      return this.populateAddressbook(shell, metadata.bookId, metadata.bookName);
    };

    this.fromCardResponse = function(vcarddata) {
      return this.populateShell(this.buildContactShell(vcarddata), vcarddata._links.self.href)
    };

    this.fromCardListResponse = function(response) {
      var self = this;
      if (response && response.data && response.data._embedded &&
        response.data._embedded['dav:item'] && response.data._embedded['dav:item'].length) {
        return $q.all(response.data._embedded['dav:item'].map(function(vcard) {
          return self.fromCardResponse(vcard);
        }));
      }
      return $q.when([]);
    };

    return this;
  });
