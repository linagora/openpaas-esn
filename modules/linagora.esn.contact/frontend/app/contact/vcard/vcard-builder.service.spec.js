'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The VcardBuilder service', function() {
  var VcardBuilder;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(angular.mock.inject(function(_VcardBuilder_) {
    VcardBuilder = _VcardBuilder_;
  }));

  describe('The toVcard function', function() {

    function compareShell(shell, ical) {
      var vcard = VcardBuilder.toVcard(shell);
      var properties = vcard.getAllProperties();
      var propkeys = properties.map(function(p) {
        return p.name;
      }).sort();
      var icalkeys = Object.keys(ical).sort();

      var message = 'Key count mismatch in ical object.\n' +
        'expected: ' + icalkeys + '\n' +
        '   found: ' + propkeys;

      expect(properties.length).to.equal(icalkeys.length, message);

      Object.keys(ical).forEach(function(propName) {
        var prop = vcard.getFirstProperty(propName);

        expect(prop, 'Missing: ' + propName).to.be.ok;
        var value = prop.toICALString();

        expect(value).to.equal(ical[propName].toString());
      });
    }

    it('should correctly create a card with display name', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        displayName: 'display name'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:display name'
      };

      compareShell(shell, ical);
    });

    it('should correctly create a card with first/last name', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        lastName: 'last',
        firstName: 'first'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:first last',
        n: 'N:last;first'
      };

      compareShell(shell, ical);
    });

    it('should correctly create a card with all props', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        lastName: 'last',
        firstName: 'first',
        starred: true,
        tags: [{text: 'a'}, {text: 'b'}],
        emails: [{type: 'Home', value: 'email@example.com'}],
        tel: [{type: 'Home', value: '123123'}],
        addresses: [{type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co'}],
        social: [{type: 'Twitter', value: '@AwesomePaaS'}],
        orgName: 'org',
        orgRole: 'role',
        urls: [{value: 'http://mywebsite.com'}],
        birthday: new Date(2015, 0, 1),
        nickname: 'nick',
        notes: 'notes',
        photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:00000000-0000-4000-a000-000000000000',
        fn: 'FN:first last',
        n: 'N:last;first',
        email: 'EMAIL;TYPE=Home:mailto:email@example.com',
        adr: 'ADR;TYPE=Home:;;s;c;;z;co',
        tel: 'TEL;TYPE=Home:123123',
        org: 'ORG:org',
        url: 'URL:http://mywebsite.com',
        role: 'ROLE:role',
        socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
        categories: 'CATEGORIES:a,b,starred',
        bday: 'BDAY;VALUE=DATE:20150101',
        nickname: 'NICKNAME:nick',
        note: 'NOTE:notes',
        photo: 'PHOTO:data:image/png;base64\\,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
      };

      compareShell(shell, ical);
    });

    it('should correctly create a card when birthday is not a Date', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        birthday: 'not sure about the birthday'
      };

      var vcard = VcardBuilder.toVcard(shell);
      var birthday = vcard.getFirstProperty('bday');

      expect(birthday.type).to.equal('text');
      expect(birthday.getFirstValue()).to.equal('not sure about the birthday');
    });

    it('should not add email in vcard when it does not have value', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        emails: [{ type: 'Home'}]
      };

      var vcard = VcardBuilder.toVcard(shell);
      var email = vcard.getFirstProperty('email');

      expect(email).is.null;
    });

    it('should not add telephone in vcard when it does not have value', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        tel: [{ type: 'Home'}]
      };

      var vcard = VcardBuilder.toVcard(shell);
      var tel = vcard.getFirstProperty('tel');

      expect(tel).is.null;
    });

    it('should not add addresse in vcard when it does not have value', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        addresses: [{ type: 'Home'}]
      };

      var vcard = VcardBuilder.toVcard(shell);
      var addresses = vcard.getFirstProperty('adr');

      expect(addresses).is.null;
    });

    it('should not add socialprofile in vcard when it does not have value', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        social: [{ type: 'Home'}]
      };

      var vcard = VcardBuilder.toVcard(shell);
      var social = vcard.getFirstProperty('socialprofile');

      expect(social).is.null;
    });

    it('should not add url in vcard when it does not have value', function() {
      var shell = {
        id: '00000000-0000-4000-a000-000000000000',
        urls: []
      };

      var vcard = VcardBuilder.toVcard(shell);
      var url = vcard.getFirstProperty('url');

      expect(url).is.null;
    });
  });

  describe('The toJSON function', function() {
    it('should build the vcard then call toJSON', function(done) {
      var shell = {foo: 'bar'};

      VcardBuilder.toVcard = function(_shell) {
        expect(_shell).to.deep.equal(shell);

        return {
          toJSON: done
        };
      };
      VcardBuilder.toJSON(shell);
    });
  });
});
