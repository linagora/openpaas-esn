'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactActionMoveController controller', function() {
  var $q, $rootScope, $controller;
  var contactService, contactAddressbookService, contactAddressbookDisplayService;
  var addressbookShell, defaultAddressbookShell;

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

    defaultAddressbookShell = {
      bookName: 'contacts'
    };
    addressbookShell = {
      bookName: 'collected'
    };
  });

  function initController(scope) {
    var $scope = scope || $rootScope.$new();
    var controller = $controller('contactActionMoveController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The listPossbileDestinations function', function() {
    it('should get all possible destination address books except input contact addressbook and convert the list to displayShells', function() {
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
          bookName: defaultAddressbookShell.bookName
        }
      };
      controller.listPossbileDestinations();
      $rootScope.$digest();

      expect(contactAddressbookService.listAddressbooksUserCanCreateContact).to.have.been.called;
      expect(contactAddressbookDisplayService.convertShellsToDisplayShells).to.have.been.called;
      expect(controller.availableAddressbookDisplayShells).to.shallowDeepEqual([{
        bookName: addressbookShell.bookName,
        shell: addressbookShell
      }]);
    });
  });

  describe('The moveContact function', function() {

    it('should call contactService.moveContact to move contact', function() {
      var controller = initController();
      var toAddressbook = { bookName: 'collected' };
      var fromAddressbook = { bookName: 'contacts' };

      contactService.moveContact = sinon.stub().returns($q.when());
      controller.contact = {
        id: '123',
        addressbook: fromAddressbook
      };
      controller.selectedAddressbook = toAddressbook;

      controller.moveContact();

      expect(contactService.moveContact).to.have.been.calledWith(fromAddressbook, toAddressbook, controller.contact);
    });
  });
});
