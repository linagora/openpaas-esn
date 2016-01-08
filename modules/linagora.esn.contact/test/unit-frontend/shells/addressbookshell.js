'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Angular module AddressBookShell', function() {

  describe('AddressBookShell', function() {

    beforeEach(angular.mock.module('linagora.esn.contact'));

    beforeEach(angular.mock.inject(function(AddressBookShell) {
      this.AddressBookShell = AddressBookShell;
    }));

    it('should return a constructor to instantiate a addressbook from input json', function() {
      var jsonInput = {
        _links: {
          self: {
            href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/1614422648.json'
          }
        },
        'dav:name': 'Twitter contacts',
        'carddav:description': 'AddressBook for Twitter contacts',
        'dav:acl': ['dav:read']
      };
      var shell = new this.AddressBookShell(jsonInput);
      expect(shell).to.shallowDeepEqual({
        id: '1614422648',
        href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/1614422648.json',
        name: 'Twitter contacts',
        description: 'AddressBook for Twitter contacts',
        readable: true,
        editable: false
      });
    });

  });

});
