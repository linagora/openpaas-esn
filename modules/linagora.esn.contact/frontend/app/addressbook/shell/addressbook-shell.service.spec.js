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
        var state = 'enabled';
        var numberOfContacts = 2018;

        jsonInput['dav:name'] = name;
        jsonInput['carddav:description'] = description;
        jsonInput.type = type;
        jsonInput.state = state;
        jsonInput.numberOfContacts = numberOfContacts;
        var shell = new AddressbookShell(jsonInput);

        expect(shell).to.shallowDeepEqual({
          bookId: bookId,
          bookName: bookName,
          href: jsonInput._links.self.href,
          name: name,
          description: description,
          type: type,
          state: state,
          numberOfContacts: numberOfContacts
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

      it('should get members right according to dav:acl for group address book', function() {
        var groupPrincipal = 'principals/domains/domainId';
        var davAcl = ['{DAV:}read', '{DAV:}write'];

        jsonInput['dav:group'] = groupPrincipal;
        jsonInput['dav:acl'] = davAcl;

        var shell = new AddressbookShell(jsonInput);

        expect(shell.rights.members).to.deep.equal(davAcl);
      });

      it('should set members right to empty array for group address book if there is no dav:acl', function() {
        var groupPrincipal = 'principals/domains/domainId';

        jsonInput['dav:group'] = groupPrincipal;

        var shell = new AddressbookShell(jsonInput);

        expect(shell.rights.members).to.be.an('array').that.is.empty;
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

      it('should build shareManagers from acl', function() {
        jsonInput.acl = [{
          principal: 'principals/users/user1Id',
          privilege: '{DAV:}share'
        }, {
          principal: 'principals/users/user2Id',
          privilege: '{DAV:}read'
        }, {
          principal: 'principals/users/user3Id',
          privilege: '{DAV:}share'
        }];

        var shell = new AddressbookShell(jsonInput);

        expect(shell.shareManagers).to.deep.equal([
          { _id: 'user1Id' },
          { _id: 'user3Id' }
        ]);
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

        it('should assign the group to group of source if subscription is not a group', function() {
          jsonInput['dav:group'] = 'principals/domains/sourceDomainId';
          jsonInput['openpaas:source'] = angular.copy(jsonInput);
          delete jsonInput['dav:group'];

          var shell = new AddressbookShell(jsonInput);

          expect(shell.group).to.deep.equal({
            type: 'domains',
            id: 'sourceDomainId'
          });
        });

        it('should build shareManagers from acl of the source address book', function() {
          jsonInput['openpaas:source'] = {
            _links: {
              self: {
                href: '/esn-sabre/esn.php/addressbooks/33333/444444.json'
              }
            },
            acl: [{
              principal: 'principals/users/user1Id',
              privilege: '{DAV:}share'
            }, {
              principal: 'principals/users/user2Id',
              privilege: '{DAV:}read'
            }, {
              principal: 'principals/users/user3Id',
              privilege: '{DAV:}share'
            }]
          };

          var shell = new AddressbookShell(jsonInput);

          expect(shell.shareManagers).to.deep.equal([
            { _id: 'user1Id' },
            { _id: 'user3Id' }
          ]);
        });

        it('should keep group of subscription even source is a group', function() {
          jsonInput['dav:group'] = 'principals/domains/sourceDomainId';
          jsonInput['openpaas:source'] = angular.copy(jsonInput);
          jsonInput['dav:group'] = 'principals/domains/domainId';

          var shell = new AddressbookShell(jsonInput);

          expect(shell.group).to.deep.equal({
            type: 'domains',
            id: 'domainId'
          });
          expect(shell.source.group).to.deep.equal({
            type: 'domains',
            id: 'sourceDomainId'
          });
        });

        it('should assign numberOfContacts to numberOfContacts of the source address book', function() {
          jsonInput.numberOfContacts = 2019;
          jsonInput['openpaas:source'] = angular.copy(jsonInput);

          jsonInput.numberOfContacts = null;
          var shell = new AddressbookShell(jsonInput);

          expect(shell.numberOfContacts).to.equal(2019);
        });
      });
    });
  });
});
