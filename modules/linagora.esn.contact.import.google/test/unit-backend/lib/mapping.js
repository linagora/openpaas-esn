'use strict';

var expect = require('chai').expect;

describe('The google contact importer mapping function', function() {
  function getModule() {
    return require('../../../backend/lib/mapping')();
  }
  describe('The toVcard function', function() {
    function compareShell(shell, ical) {
      var vcard = getModule().toVcard(shell);

      Object.keys(ical).forEach(function(propName) {
        var prop = vcard.getFirstProperty(propName);
        var value = prop.toICAL();
        expect(value).to.equal(ical[propName].toString());
      });
    }
    it('should correctly create card from a Google following with all props', function() {
      var following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gd:name': [{ 'gd:fullName': ['full name'] }],
        'gContact:nickname': ['nickname'],
        'gd:im': [
          {$: {
            address: 'skype account',
            protocol: 'skype'
          }},
          {$: {
            address: 'hangout account',
            protocol: 'hangout'
          }},
          {$: {
            address: 'yahoo account',
            protocol: 'yahoo'
          }}
        ],
        'gd:email': [{
          $: {
            rel: 'http://schemas.google.com/g/2005#home',
            address: 'mailto:nickname@gmail.com'
          }
        }],
        'gContact:birthday': [{ $: { when: '20150101' } }],
        'gd:organization': [{
          'gd:orgName': ['orgName'],
          'gd:orgTitle': ['orgTitle']
        }],
        'gd:phoneNumber': [{
          $: {
            rel: 'http://schemas.google.com/g/2005#mobile',
            uri: 'tel:+84-91-698-16-90'
          }
        }],
        'gContact:website': [{
          $: {
            href: 'http://schemas.google.com'
          }
        }],
        'gd:structuredPostalAddress': [{
          $: {
            rel: 'http://schemas.google.com/g/2005#home'
          },
          'gd:street': ['10 Rue www'],
          'gd:postcode': ['75017'],
          'gd:city': ['Paris'],
          'gd:country': ['France']
        }],
        contactPhoto: 'my photo'
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:full name',
        n: 'N:name;full',
        email: 'EMAIL;TYPE=home:mailto:nickname@gmail.com',
        adr: 'ADR;TYPE=home:;;10 Rue www;Paris;;75017;France',
        tel: 'TEL;TYPE=mobile:tel:+84-91-698-16-90',
        org: 'ORG:orgName',
        url: 'URL:http://schemas.google.com',
        role: 'ROLE:orgTitle',
        socialprofile: 'SOCIALPROFILE;TYPE=skype:skype account',
        categories: 'CATEGORIES:Google',
        bday: 'BDAY:20150101',
        nickname: 'NICKNAME:nickname',
        photo: 'PHOTO:my photo'
      };

      compareShell(following, ical);
    });

    it('should correctly get formatted name', function() {
      var following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: ['formatted name']
      };
      var ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:formatted name',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);

      following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gd:name': [{ 'gd:fullName': ['formatted name'] }]
      };
      ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:formatted name',
        n: 'N:name;formatted',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);

      following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gd:organization': [{
          'gd:orgName': ['orgName']
        }]
      };
      ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:orgName',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);

      following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gd:organization': [{
          'gd:orgTitle': ['orgTitle']
        }]
      };
      ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:orgTitle',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);

      following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gContact:nickname': ['nickname']
      };
      ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:nickname',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);

      following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gd:email': [{
          $: {
            rel: 'http://schemas.google.com/g/2005#home',
            address: 'mailto:nickname@gmail.com'
          }
        }]
      };
      ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:nickname@gmail.com',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);

      following = {
        id: ['http://www.google.com/m8/feeds/contacts/base/536754a38c090d23'],
        title: [''],
        'gd:phoneNumber': [{
          $: {
            rel: 'http://schemas.google.com/g/2005#mobile',
            uri: 'tel:+84-91-698-16-90'
          }
        }]
      };
      ical = {
        version: 'VERSION:4.0',
        uid: 'UID:536754a38c090d23',
        fn: 'FN:+84-91-698-16-90',
        categories: 'CATEGORIES:Google'
      };

      compareShell(following, ical);
    });
  });
});
