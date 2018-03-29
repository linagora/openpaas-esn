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

  .service('ContactShellBuilder', function($log, $q, ContactShell, ICAL, ContactShellHelper, contactUpdateDataService, contactAvatarService) {

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

    this.populateShell = function(shell, href) {
      var metadata = ContactShellHelper.getMetadata(href);
      if (!metadata || !metadata.bookId || !metadata.bookName) {
        return $q.when(shell);
      }
      return this.populateAddressbook(shell, metadata.bookId, metadata.bookName);
    };

    this.fromCardResponse = function(vcarddata) {
      return this.populateShell(this.fromVcard(vcarddata.data), vcarddata._links.self.href);
    };

    this.fromWebSocket = function(data) {
      return this.populateAddressbook(this.fromVcard(data.vcard), data.bookId, data.bookName);
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
  })

  .service('VcardBuilder', function(ICAL, ContactsHelper) {

    this.toVcard = function(shell) {
      var prop;
      var vcard = new ICAL.Component('vcard');

      vcard.addPropertyWithValue('version', '4.0');
      vcard.addPropertyWithValue('uid', shell.id);

      if (shell.displayName) {
        vcard.addPropertyWithValue('fn', shell.displayName);
      } else {
        vcard.addPropertyWithValue('fn', ContactsHelper.getFormattedName(shell));
      }

      if (shell.lastName || shell.firstName) {
        vcard.addPropertyWithValue('n', [shell.lastName || '', shell.firstName || '']);
      }

      var categories = [];
      if (shell.tags) {
        categories = categories.concat(shell.tags.map(function(tag) { return tag.text; }));
      }

      if (shell.starred) {
        categories.push('starred');
      }

      if (categories.length) {
        prop = new ICAL.Property('categories');
        prop.setValues(categories);
        vcard.addProperty(prop);
      }

      if (shell.orgName) {
        vcard.addPropertyWithValue('org', [shell.orgName]);
      }

      if (shell.orgRole) {
        vcard.addPropertyWithValue('role', shell.orgRole);
      }

      if (shell.emails) {
        shell.emails.forEach(function(data) {
          if (data.value) {
            var prop = vcard.addPropertyWithValue('email', 'mailto:' + data.value);
            prop.setParameter('type', data.type);
          }
        });
      }

      if (shell.tel) {
        shell.tel.forEach(function(data) {
          if (data.value) {
            var prop = vcard.addPropertyWithValue('tel', 'tel:' + data.value);
            prop.setParameter('type', data.type);
          }
        });
      }

      if (shell.addresses) {
        shell.addresses.forEach(function(data) {
          if (data.street || data.city || data.zip || data.country) {
            var val = ['', '', data.street, data.city, '', data.zip, data.country];
            var prop = vcard.addPropertyWithValue('adr', val);
            prop.setParameter('type', data.type);
          }
        });
      }

      if (shell.social) {
        shell.social.forEach(function(data) {
          if (data.value) {
            var prop = vcard.addPropertyWithValue('socialprofile', data.value);
            prop.setParameter('type', data.type);
          }
        });
      }

      if (shell.urls) {
        shell.urls.forEach(function(data) {
          if (data.value) {
            vcard.addPropertyWithValue('url', data.value);
          }
        });
      }

      if (shell.birthday) {
        var bdayProperty = new ICAL.Property('bday');
        if (shell.birthday instanceof Date) {
          var value = ICAL.Time.fromJSDate(shell.birthday);
          value.isDate = true;
          bdayProperty.setValue(value);
        } else {
          bdayProperty.resetType('text');
          bdayProperty.setValue(shell.birthday);
        }
        vcard.addProperty(bdayProperty);
      }

      if (shell.nickname) {
        vcard.addPropertyWithValue('nickname', shell.nickname);
      }

      if (shell.notes) {
        vcard.addPropertyWithValue('note', shell.notes);
      }

      if (shell.photo) {
        vcard.addPropertyWithValue('photo', shell.photo);
      }

      return vcard;
    };

    this.toJSON = function(shell) {
      return this.toVcard(shell).toJSON();
    };
  });
