'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contact Angular module AddressbookShell', function() {

  var bookId = '5666b4cff5d672f316d4439f';
  var bookName = '1614422648';
  var AddressbookShell, contactAddressbookACLHelper;
  var CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL, CONTACT_ADDRESSBOOK_PUBLIC_RIGHT;

  describe('AddressbookShell', function() {

    beforeEach(module('linagora.esn.contact'));

    beforeEach(function() {
      inject(function(
        _AddressbookShell_,
        _contactAddressbookACLHelper_,
        _CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL_,
        _CONTACT_ADDRESSBOOK_PUBLIC_RIGHT_
      ) {
        AddressbookShell = _AddressbookShell_;
        contactAddressbookACLHelper = _contactAddressbookACLHelper_;
        CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL = _CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL_;
        CONTACT_ADDRESSBOOK_PUBLIC_RIGHT = _CONTACT_ADDRESSBOOK_PUBLIC_RIGHT_;
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

      it('should set public right property to the highest priority right according to acl', function() {
        jsonInput.acl = [
          { privilege: '{DAV:}read', principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL, protected: true },
          { privilege: '{DAV:}write', principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL, protected: true }
        ];

        var shell = new AddressbookShell(jsonInput);

        expect(shell.rights.public).to.equal('{DAV:}write');
      });

      it('should set public right property to private if there is no acl present', function() {
        var shell = new AddressbookShell(jsonInput);

        expect(shell.rights.public).to.equal(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT.PRIVATE.value);
      });

      it('should build sharees from dav:invite', function() {
        jsonInput['dav:invite'] = [{
          access: 3,
          href: 'mailto:example1@example.com',
          inviteStatus: 1,
          principal: 'principals/users/123'
        }, {
          access: 3,
          href: 'mailto:example2@example.com',
          inviteStatus: 1,
          principal: 'principals/users/456'
        }];

        var shell = new AddressbookShell(jsonInput);

        expect(shell.sharees).to.shallowDeepEqual([{
          userId: '123'
        }, {
          userId: '456'
        }]);
      });

      it('should build group from dav:group', function() {
        jsonInput['dav:group'] = 'principals/domains/domainId';

        var shell = new AddressbookShell(jsonInput);

        expect(shell.group).to.deep.equal({
          type: 'domains',
          id: 'domainId'
        });
      });

      describe('The subscription AB', function() {
        it('should mark as subscription if there is openpaas:source field', function() {
          jsonInput['openpaas:source'] = angular.copy(jsonInput);

          var shell = new AddressbookShell(jsonInput);

          expect(shell.isSubscription).to.equal(true);
        });

        it('should assign the subscription type', function() {
          jsonInput['openpaas:source'] = angular.copy(jsonInput);
          jsonInput['openpaas:subscription-type'] = 'my_type';

          var shell = new AddressbookShell(jsonInput);

          expect(shell.subscriptionType).to.equal('my_type');
        });

        it('should assign the share access', function() {
          jsonInput['openpaas:source'] = angular.copy(jsonInput);
          jsonInput['dav:share-access'] = 'read';

          var shell = new AddressbookShell(jsonInput);

          expect(shell.shareAccess).to.equal('read');
        });
      });
    });
  });
});
