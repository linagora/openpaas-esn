'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contact Angular module AddressbookShell', function() {

  var bookId = '5666b4cff5d672f316d4439f';
  var bookName = '1614422648';
  var AddressbookShell, contactAddressbookACLHelper;

  describe('AddressbookShell', function() {

    beforeEach(module('linagora.esn.contact'));

    beforeEach(function() {
      inject(function(_AddressbookShell_, _contactAddressbookACLHelper_) {
        AddressbookShell = _AddressbookShell_;
        contactAddressbookACLHelper = _contactAddressbookACLHelper_;
      });

      contactAddressbookACLHelper.canEditAddressbook = angular.noop;
      contactAddressbookACLHelper.canDeleteAddressbook = angular.noop;
      contactAddressbookACLHelper.canCreateContact = angular.noop;
      contactAddressbookACLHelper.canEditContact = angular.noop;
      contactAddressbookACLHelper.canCopyContact = angular.noop;
      contactAddressbookACLHelper.canMoveContact = angular.noop;
      contactAddressbookACLHelper.canDeleteContact = angular.noop;
    });

    describe('The constructor', function() {
      var jsonInput;

      beforeEach(function() {
        jsonInput = {
          _links: {
            self: {
              href: '/esn-sabre/esn.php/addressbooks/' + bookId + '/' + bookName + '.json'
            }
          }
        };
      });

      it('should fill attributes from json', function() {
        var name = 'Twitter contacts';
        var description = 'AddressBook for Twitter contacts';
        var type = 'twitter';

        jsonInput['dav:name'] = name;
        jsonInput['carddav:description'] = description;
        jsonInput.type = type;
        var shell = new AddressbookShell(jsonInput);

        expect(shell).to.shallowDeepEqual({
          bookId: bookId,
          bookName: bookName,
          href: jsonInput._links.self.href,
          name: name,
          description: description,
          type: type
        });
      });

      it('should set source attribute with source bookId and bookName when input json is from a subscription addressbook', function() {
        jsonInput['openpaas:source'] = {
          _links: {
            self: {
              href: '/esn-sabre/esn.php/addressbooks/2222/3333.json'
            }
          }
        };

        var shell = new AddressbookShell(jsonInput);

        expect(shell.source.bookId).to.equal('2222');
        expect(shell.source.bookName).to.equal('3333');
        expect(shell.isSubscription).to.equal(true);
      });
    });
  });
});
