'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactAddressbookDisplayService service', function() {
  var contactAddressbookDisplayService, ContactAddressbookDisplayShell, contactAddressbookDisplayShellRegistry, displayShellRegistry;

  beforeEach(function() {
    module('linagora.esn.contact');
    module(function($provide) {
      displayShellRegistry = {};
      contactAddressbookDisplayShellRegistry = {
        getAll: function() {
          return displayShellRegistry;
        },
        add: angular.noop
      };

      $provide.value('contactAddressbookDisplayShellRegistry', contactAddressbookDisplayShellRegistry);
    });
    inject(function(
      _contactAddressbookDisplayService_,
      _ContactAddressbookDisplayShell_
    ) {
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
      ContactAddressbookDisplayShell = _ContactAddressbookDisplayShell_;
    });
  });

  describe('The convertShellToDisplayShell function', function() {
    it('should convert addressbook shell to a registered display shell if the addressbook properties are satisfied with display shell matching function', function() {
      var DummyDisplayShell = function(shell) {
        this.shell = shell;
      };

      var addressbookShell = {
        bookName: 'dummy',
        type: 'dummy'
      };

      displayShellRegistry = {
        dummy: {
          id: 'dummy',
          matchingFunction: function(book) {
            return book.type === 'dummy';
          },
          displayShell: DummyDisplayShell
        }
      };

      var result = contactAddressbookDisplayService.convertShellToDisplayShell(addressbookShell);

      expect(result).to.be.an.instanceof(DummyDisplayShell);
    });

    it('should convert addressbook to ContactAddressbookDisplayShell if it does not match any registered display shells', function() {
      var addressbookShell = {
        bookName: 'dummy',
        type: 'dummy'
      };

      var result = contactAddressbookDisplayService.convertShellToDisplayShell(addressbookShell);

      expect(result).to.be.an.instanceof(ContactAddressbookDisplayShell);
    });
  });

  describe('The convertShellToDisplayShell function', function() {
    it('should convert addressbook shells to a registered display shells', function() {
      var DisplayShell1 = function(shell) {
        this.shell = shell;
      };
      var DisplayShell2 = function(shell) {
        this.shell = shell;
      };
      var addressbookShells = [{
        bookName: 'addressbook1',
        type: 'shell1'
      }, {
        bookName: 'addressbook2',
        type: 'shell2'
      }];

      displayShellRegistry = {
        shell1: {
          id: 'shell1',
          matchingFunction: function(book) {
            return book.type === 'shell1';
          },
          displayShell: DisplayShell1
        },
        shell2: {
          id: 'shell2',
          matchingFunction: function(book) {
            return book.type === 'shell2';
          },
          displayShell: DisplayShell2
        }
      };

      var result = contactAddressbookDisplayService.convertShellsToDisplayShells(addressbookShells);

      expect(result[0]).to.be.an.instanceof(DisplayShell1);
      expect(result[1]).to.be.an.instanceof(DisplayShell2);
    });
  });

  describe('The buildDisplayName function', function() {
    it('should convert the addressbook to a matched display shell then return the display name', function() {
      var DummyDisplayShell = function(shell) {
        this.shell = shell;
        this.displayName = 'A dummy addressbook';
      };
      var addressbook = {
        type: 'dummy'
      };

      displayShellRegistry = {
        dummy: {
          id: 'dummy',
          matchingFunction: function(book) {
            return book.type === 'dummy';
          },
          displayShell: DummyDisplayShell
        }
      };

      var result = contactAddressbookDisplayService.buildDisplayName(addressbook);

      expect(result).to.equal('A dummy addressbook');
    });

    it('should return the addressbook name if there is no matched display shell', function() {
      var addressbook = {
        bookName: 'contacts',
        name: 'My contacts'
      };

      var result = contactAddressbookDisplayService.buildDisplayName(addressbook);

      expect(result).to.equal(addressbook.name);
    });

    it('should return the addressbook bookName if there is no matched display shell or addressbook name', function() {
      var addressbook = {
        bookName: 'contacts'
      };

      var result = contactAddressbookDisplayService.buildDisplayName(addressbook);

      expect(result).to.equal(addressbook.bookName);
    });
  });

  describe('The sortAddressbookDisplayShells function', function() {
    it('should return sorted list of address book display shells', function() {
      var addressbookShell1 = {
        displayName: 'AB1',
        priority: 1
      };
      var addressbookShell2_1 = {
        displayName: 'AB2_1',
        priority: 2
      };
      var addressbookShell2_2 = {
        displayName: 'AB2_2',
        priority: 2
      };
      var addressbookShell4 = {
        displayName: 'AB4',
        priority: 3
      };

      var addressbookDisplayShells = [
        addressbookShell4,
        addressbookShell2_2,
        addressbookShell1,
        addressbookShell2_1
      ];
      var expectResult = [
        addressbookShell1,
        addressbookShell2_1,
        addressbookShell2_2,
        addressbookShell4
      ];
      var sortedAddressbookDisplayShells = contactAddressbookDisplayService.sortAddressbookDisplayShells(addressbookDisplayShells);

      expect(sortedAddressbookDisplayShells).to.deep.equal(expectResult);
    });
  });
});
