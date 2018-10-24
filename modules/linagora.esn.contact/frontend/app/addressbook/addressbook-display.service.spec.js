'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactAddressbookDisplayService service', function() {
  var $rootScope, contactAddressbookDisplayService, ContactAddressbookDisplayShell, contactAddressbookDisplayShellRegistry, displayShellRegistry, esnConfigMock, CONTACT_ADDRESSBOOK_TYPES;

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

      esnConfigMock = function() {
        return $q.when(true);
      };

      $provide.value('esnConfig', esnConfigMock);
      $provide.value('contactAddressbookDisplayShellRegistry', contactAddressbookDisplayShellRegistry);
    });
    inject(function(
      _$rootScope_,
      _contactAddressbookDisplayService_,
      _ContactAddressbookDisplayShell_,
      _CONTACT_ADDRESSBOOK_TYPES_
    ) {
      $rootScope = _$rootScope_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
      ContactAddressbookDisplayShell = _ContactAddressbookDisplayShell_;
      CONTACT_ADDRESSBOOK_TYPES = _CONTACT_ADDRESSBOOK_TYPES_;
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

    it('should include actions metadata from regsitry with includeActions option is true', function() {
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
          actions: [
            'action1',
            'action2'
          ],
          displayShell: DummyDisplayShell
        }
      };

      var result = contactAddressbookDisplayService.convertShellToDisplayShell(addressbookShell, {
        includeActions: true
      });

      expect(result).to.be.an.instanceof(DummyDisplayShell);
      expect(result.actions).to.deep.equal(displayShellRegistry.dummy.actions);
    });

    it('should include priority metadata from regsitry with includePriority option is true', function() {
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
          priority: 1,
          displayShell: DummyDisplayShell
        }
      };

      var result = contactAddressbookDisplayService.convertShellToDisplayShell(addressbookShell, {
        includePriority: true
      });

      expect(result).to.be.an.instanceof(DummyDisplayShell);
      expect(result.priority).to.deep.equal(displayShellRegistry.dummy.priority);
    });
  });

  describe('The convertShellsToDisplayShells function', function() {
    it('should convert addressbook shells to a registered display shells', function(done) {
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

      contactAddressbookDisplayService.convertShellsToDisplayShells(addressbookShells).then(function(result) {
        expect(result[0]).to.be.an.instanceof(DisplayShell1);
        expect(result[1]).to.be.an.instanceof(DisplayShell2);

        done();
      }).catch(done());

      $rootScope.$digest();
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

  describe('The categorizeDisplayShells function', function() {
    it('should categorize displayShells', function() {
      var userAddressbookDisplayShell1 = {
        displayName: '1',
        shell: {}
      };
      var userAddressbookDisplayShell2 = {
        displayName: '2',
        shell: {}
      };
      var externalAddressbookDisplayShell1 = {
        displayName: '3',
        shell: {
          isSubscription: true
        }
      };
      var virtualAddressbookDisplay1 = {
        displayName: '4',
        shell: {
          type: CONTACT_ADDRESSBOOK_TYPES.virtual
        }
      };

      var groupAddressbookDisplay1 = {
        displayName: '4',
        shell: {
          type: CONTACT_ADDRESSBOOK_TYPES.group
        }
      };

      var categorized = contactAddressbookDisplayService.categorizeDisplayShells([
        userAddressbookDisplayShell1,
        userAddressbookDisplayShell2,
        externalAddressbookDisplayShell1,
        virtualAddressbookDisplay1,
        groupAddressbookDisplay1
      ]);

      expect(categorized.userAddressbooks).to.deep.equal([
        userAddressbookDisplayShell1,
        userAddressbookDisplayShell2
      ]);
      expect(categorized.sharedAddressbooks).to.deep.equal([
        externalAddressbookDisplayShell1
      ]);
      expect(categorized.virtualAddressbooks).to.deep.equal([
        virtualAddressbookDisplay1, groupAddressbookDisplay1
      ]);
    });
  });
});
