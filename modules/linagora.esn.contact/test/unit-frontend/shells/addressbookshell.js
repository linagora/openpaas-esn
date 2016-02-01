'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Angular module AddressBookShell', function() {

  var bookId = '5666b4cff5d672f316d4439f';
  var bookName = '1614422648';

  describe('AddressBookShell', function() {

    beforeEach(angular.mock.module('linagora.esn.contact'));

    beforeEach(angular.mock.inject(function(AddressBookShell) {
      this.AddressBookShell = AddressBookShell;
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
        var shell = new this.AddressBookShell(jsonInput);

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
        var shell = new this.AddressBookShell(jsonInput);
        expect(shell.readable).to.not.be.ok;
        expect(shell.editable).to.not.be.ok;
      });

      it('should not set ACL attributes when dav:acl is empty', function() {
        jsonInput['dav:acl'] = [];
        var shell = new this.AddressBookShell(jsonInput);

        expect(shell.readable).to.not.be.ok;
        expect(shell.editable).to.not.be.ok;
      });

      it('should set readable attribute to true when dav:read is defined in dav:acl array', function() {
        jsonInput['dav:acl'] = ['dav:read'];
        var shell = new this.AddressBookShell(jsonInput);

        expect(shell.readable).to.be.ok;
        expect(shell.editable).to.not.be.ok;
      });

      it('should set editable attribute to true when dav:write is defined in dav:acl array', function() {
        jsonInput['dav:acl'] = ['dav:write'];
        var shell = new this.AddressBookShell(jsonInput);

        expect(shell.readable).to.not.be.ok;
        expect(shell.editable).to.be.ok;
      });

      it('should set editable and readable attributes to true when defined in dav:acl array', function() {
        jsonInput['dav:acl'] = ['dav:write', 'dav:read'];
        var shell = new this.AddressBookShell(jsonInput);
        expect(shell.readable).to.be.ok;
        expect(shell.editable).to.be.ok;
      });
    });
  });
});
