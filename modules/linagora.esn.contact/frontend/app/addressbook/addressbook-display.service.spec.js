'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactAddressbookDisplayService service', function() {
  var contactAddressbookDisplayService, ContactAddressbookDisplayShell, contactAddressbookDisplayShellRegistry, displayShellRegistry;

  beforeEach(function() {
    module('esn.notification');
    module('linagora.esn.contact', function($provide) {
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

  describe('The buildAddressbookDisplayShells function', function() {
    it('should convert addressbook to a registered display shell if the addressbook properties are satisfied with display shell matching function', function() {
      var DummyDisplayShell = function(shell) {
        this.shell = shell;
      };

      var addressbooks = [{
        bookName: 'dummy',
        type: 'dummy'
      }];

      displayShellRegistry = {
        dummy: {
          id: 'dummy',
          matchingFunction: function(book) {
            return book.type === 'dummy';
          },
          displayShell: DummyDisplayShell
        }
      };

      var result = contactAddressbookDisplayService.buildAddressbookDisplayShells(addressbooks);

      expect(result).to.have.length(1);
      expect(result[0]).to.be.an.instanceof(DummyDisplayShell);
    });

    it('should convert addressbook to ContactAddressbookDisplayShell if it does not match any registered display shells', function() {
      var addressbooks = [{
        bookName: 'dummy',
        type: 'dummy'
      }];

      var result = contactAddressbookDisplayService.buildAddressbookDisplayShells(addressbooks);

      expect(result).to.have.length(1);
      expect(result[0]).to.be.an.instanceof(ContactAddressbookDisplayShell);
    });

    it('should return an array of addressbook display shells in favor of lower priotiry display shells first', function() {
      var DummyDisplayShell = function(shell) {
        this.shell = shell;
      };
      var ContactDisplayShell = function(shell) {
        this.shell = shell;
      };

      var addressbooks = [{
        bookName: 'dummy',
        name: 'should be prioritied 2nd',
        type: 'dummy'
      }, {
        bookName: 'contacts',
        name: 'should be prioritied 1st'
      }, {
        bookName: 'extra',
        name: 'should be prioritied last'
      }, {
        bookName: 'dummy2',
        name: 'should be prioritied 2nd',
        type: 'dummy'
      }];

      displayShellRegistry = {
        dummy: {
          id: 'dummy module',
          priority: 2,
          matchingFunction: function(book) { return book.type === 'dummy'; },
          displayShell: DummyDisplayShell
        },
        'linagora.esn.contact': {
          id: 'linagora.esn.contact',
          priority: 1,
          matchingFunction: function(book) { return book.bookName === 'contacts'; },
          displayShell: ContactDisplayShell
        }
      };

      var result = contactAddressbookDisplayService.buildAddressbookDisplayShells(addressbooks);

      expect(result).to.have.length(4);
      expect(result[0]).to.be.an.instanceof(ContactDisplayShell);
      expect(result[1]).to.be.an.instanceof(DummyDisplayShell);
      expect(result[2]).to.be.an.instanceof(DummyDisplayShell);
      expect(result[3]).to.be.an.instanceof(ContactAddressbookDisplayShell);
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
});
