'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contact Angular module AddressbookShell', function() {

  var bookId = '5666b4cff5d672f316d4439f';
  var bookName = '1614422648';
  var AddressbookShell;

  describe('AddressbookShell', function() {

    beforeEach(module('linagora.esn.contact'));

    beforeEach(inject(function(_AddressbookShell_) {
      AddressbookShell = _AddressbookShell_;
    }));

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

      it('should not set ACL attributes when dav:acl is undefined', function() {
        var shell = new AddressbookShell(jsonInput);

        expect(shell.readable).to.not.be.ok;
        expect(shell.editable).to.not.be.ok;
      });

      it('should not set ACL attributes when dav:acl is empty', function() {
        jsonInput['dav:acl'] = [];
        var shell = new AddressbookShell(jsonInput);

        expect(shell.readable).to.not.be.ok;
        expect(shell.editable).to.not.be.ok;
      });

      it('should set readable attribute to true when dav:read is defined in dav:acl array', function() {
        jsonInput['dav:acl'] = ['dav:read'];
        var shell = new AddressbookShell(jsonInput);

        expect(shell.readable).to.be.ok;
        expect(shell.editable).to.not.be.ok;
      });

      it('should set editable attribute to true when dav:write is defined in dav:acl array', function() {
        jsonInput['dav:acl'] = ['dav:write'];
        var shell = new AddressbookShell(jsonInput);

        expect(shell.readable).to.not.be.ok;
        expect(shell.editable).to.be.ok;
      });

      it('should set editable and readable attributes to true when defined in dav:acl array', function() {
        jsonInput['dav:acl'] = ['dav:write', 'dav:read'];
        var shell = new AddressbookShell(jsonInput);

        expect(shell.readable).to.be.ok;
        expect(shell.editable).to.be.ok;
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
      });

      describe('The isSubscription function', function() {
        it('should return true if the addressbook shell is a subscription', function() {
          jsonInput['openpaas:source'] = {
            _links: {
              self: {
                href: '/esn-sabre/esn.php/addressbooks/2222/3333.json'
              }
            }
          };
          var subscription = new AddressbookShell(jsonInput);

          expect(subscription.isSubscription()).to.be.true;
        });

        it('should return false if the addressbook shell is not a subscription', function() {
          var notSubscription = new AddressbookShell(jsonInput);

          expect(notSubscription.isSubscription()).to.be.false;
        });
      });
    });
  });
});
