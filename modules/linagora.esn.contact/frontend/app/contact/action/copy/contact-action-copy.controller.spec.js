'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactActionCopyController controller', function() {
  var $q, $rootScope, $controller;
  var contactService, contactAddressbookService, contactAddressbookDisplayService;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(
      _$q_,
      _$controller_,
      _$rootScope_,
      _contactService_,
      _contactAddressbookService_,
      _contactAddressbookDisplayService_
    ) {
      $q = _$q_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactService = _contactService_;
      contactAddressbookService = _contactAddressbookService_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    });
  });

  function initController(scope) {
    var $scope = scope || $rootScope.$new();
    var controller = $controller('contactActionCopyController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  var defaultAddressbookShell = {
    bookName: 'contacts'
  };
  var addressbookShell = {
    bookName: 'collected'
  };

  describe('The listPossibleDestinations function', function() {
    it('should get all possible destination address books except current address book and convert the list to displayShells', function() {
      contactAddressbookDisplayService.convertShellsToDisplayShells = sinon.spy(function(shells) {
        return shells.map(function(shell) {
          return {
            bookName: shell.bookName,
            shell: shell
          };
        });
      });

      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([defaultAddressbookShell, addressbookShell]));
      var controller = initController();

      controller.contact = {
        id: '123',
        addressbook: {
          bookName: 'contacts'
        }
      };
      controller.listPossibleDestinations();
      $rootScope.$digest();

      expect(contactAddressbookService.listAddressbooksUserCanCreateContact).to.have.been.called;
      expect(contactAddressbookDisplayService.convertShellsToDisplayShells).to.have.been.called;
      expect(controller.availableAddressbookDisplayShells).to.shallowDeepEqual([{
        bookName: addressbookShell.bookName,
        shell: addressbookShell
      }]);
    });
  });

  describe('The copyContact function', function() {

    beforeEach(function() {
      contactAddressbookDisplayService.convertShellsToDisplayShells = function(shells) {
        return shells.map(function(shell) {
          shell.shell = {
            bookName: shell.bookName
          };

          return shell;
        });
      };

      contactAddressbookService.listAddressbooksUserCanCreateContact = function() {
        return $q.when([
          { bookName: 'contacts' },
          { bookName: 'collected' }
        ]);
      };
    });

    it('should call contactService.copyContact to copy contact', function() {
      var controller = initController();
      var destAddressbook = { bookName: 'collected' };

      contactService.copyContact = sinon.stub().returns($q.when());
      controller.contact = {
        id: '123',
        addressbook: {
          bookName: 'contacts'
        }
      };
      controller.selectedAddressbook = destAddressbook;

      controller.listPossibleDestinations();
      $rootScope.$digest();

      controller.copyContact();

      expect(contactService.copyContact).to.have.been.calledWith(controller.selectedAddressbook, controller.contact);
    });
  });
});
