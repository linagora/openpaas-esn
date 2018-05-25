(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .service('VcardBuilder', VcardBuilder);

  function VcardBuilder(ICAL, ContactsHelper) {

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
            var prop = vcard.addPropertyWithValue('tel', data.value);

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
  }
})(angular);
