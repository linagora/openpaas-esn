'use strict';

/* global chai: false */
var expect = chai.expect;

describe('ContactShell services', function() {
  var ICAL, notificationFactory;

  beforeEach(function() {

    notificationFactory = {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(ContactShell, _ICAL_) {
      this.ContactShell = ContactShell;
      ICAL = _ICAL_;
    });
  });

  function buildFakeVcard(displayName, tag) {
    var vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    vcard.addPropertyWithValue('uid', '0');

    if (displayName) {
      vcard.addPropertyWithValue('fn', displayName);
    } else {
      vcard.addPropertyWithValue('fn', 'Test ContactShell');
    }

    vcard.addPropertyWithValue('n', ['ContactShell', 'Test']);

    var categories = [];

    categories = categories.concat(['tag1', 'tag2', 'tagn']);

    if (tag) {
      categories = categories.concat(tag);
    }
    categories.push('starred');

    var prop = new ICAL.Property('categories');

    prop.setValues(categories);
    vcard.addProperty(prop);

    vcard.addPropertyWithValue('org', ['organisation']);
    vcard.addPropertyWithValue('role', 'openpaasrole');

    for (var i = 0, types = ['Home', 'Work', 'Other'], socials = ['Twitter', 'Skype', 'Other']; i < types.length; i++) {
      prop = vcard.addPropertyWithValue('email', 'mailto:joe' + i + '@linagora.com');
      prop.setParameter('type', types[i]);
      prop = vcard.addPropertyWithValue('tel', 'tel:01.01.01.01.0' + i);
      prop.setParameter('type', types[i]);
      var val = ['', '', 'Super Street' + i, 'Super City' + i, '', 'Super Zip' + i, 'Super Country' + i];

      prop = vcard.addPropertyWithValue('adr', val);
      prop.setParameter('type', types[i]);
      prop = vcard.addPropertyWithValue('socialprofile', socials[i] + 'id');
      prop.setParameter('type', socials[i]);
    }
    vcard.addPropertyWithValue('url', 'http://www.nulpart.com');

    vcard.addPropertyWithValue('bday', new ICAL.Time({
      year: 2012,
      month: 10,
      day: 11,
      minute: 0,
      second: 0,
      isDate: false
    }));

    vcard.addPropertyWithValue('nickname', 'surnom');
    vcard.addPropertyWithValue('note', 'Quelques commentaires...');
    vcard.addPropertyWithValue('photo', 'https://www.linagora.com/avatar/1');

    return vcard;
  }

  describe('ContactShell factory', function() {

    function checkShellContactCreatedObject(shell, etag) {
      expect(shell.id).to.equal('0');
      expect(shell.displayName).to.equal('Test ContactShell');
      expect(shell.lastName).to.equal('ContactShell');
      expect(shell.firstName).to.equal('Test');
      expect(shell.tags.map(function(tag) {
        return tag.text;
      })).to.deep.equal(['tag1', 'tag2', 'tagn']);

      expect(shell.starred).to.equal(true);
      expect(shell.orgName).to.equal('organisation');
      expect(shell.orgRole).to.equal('openpaasrole');

      for (var i = 0, types = ['Home', 'Work', 'Other'], socials = ['Twitter', 'Skype', 'Other']; i < types.length; i++) {
        expect(shell.emails[i].value).to.equal('joe' + i + '@linagora.com');
        expect(shell.emails[i].type).to.equal(types[i]);
        expect(shell.tel[i].value).to.equal('01.01.01.01.0' + i);
        expect(shell.tel[i].type).to.equal(types[i]);
        expect(shell.addresses[i]).to.deep.equal({
          type: types[i],
          street: 'Super Street' + i,
          city: 'Super City' + i,
          zip: 'Super Zip' + i,
          country: 'Super Country' + i
        });
        expect(shell.social[i].value).to.equal(socials[i] + 'id');
        expect(shell.social[i].type).to.equal(socials[i]);
      }

      expect(shell.urls).to.deep.equal([{value: 'http://www.nulpart.com'}]);
      expect(shell.birthday).to.deep.equal(new ICAL.Time({
        year: 2012,
        month: 10,
        day: 11,
        minute: 0,
        second: 0,
        isDate: false
      }).toJSDate());
      expect(shell.nickname).to.equal('surnom');
      expect(shell.notes).to.equal('Quelques commentaires...');
      expect(shell.photo).to.equal('https://www.linagora.com/avatar/1');

      if (etag) {
        expect(shell.etag).to.equal(etag);
      } else {
        expect(shell.etag).toBeUndefined;
      }
    }

    it('should return a constructor to instantiate a contact from a vcard', function() {
      var cardInput = buildFakeVcard();
      var shell = new this.ContactShell(cardInput);

      checkShellContactCreatedObject(shell);
    });

    it('should set the etag', function() {
      var cardInput = buildFakeVcard();
      var etag = '12345678';
      var shell = new this.ContactShell(cardInput, etag);

      checkShellContactCreatedObject(shell, etag);
    });
  });

});
