'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ContactSidebarController controller', function() {
  var $rootScope, $controller;
  var contactAddressbookService, contactAddressbookDisplayService;
  var CONTACT_ADDRESSBOOK_EVENTS;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(
      _$controller_,
      _$rootScope_,
      _contactAddressbookDisplayService_,
      _contactAddressbookService_,
      _CONTACT_ADDRESSBOOK_EVENTS_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
      contactAddressbookService = _contactAddressbookService_;
      CONTACT_ADDRESSBOOK_EVENTS = _CONTACT_ADDRESSBOOK_EVENTS_;
    });
  });

  function initController() {
    var $scope = $rootScope.$new();
    var controller = $controller('ContactSidebarController', {$scope: $scope});

    controller.$onInit();
    $rootScope.$digest();

    return controller;
  }

  describe('$onInit fn', function() {
    it('should get the list of addressbooks then build and arranger the addressbook display shells', function() {
      var addressbooks = [
        {
          displayName: 'bookA',
          priority: 1
        },
        {
          displayName: 'bookB',
          priority: 10
        }
      ];

      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when(addressbooks));
      contactAddressbookDisplayService.convertShellsToDisplayShells = sinon.spy();
      contactAddressbookDisplayService.sortAddressbookDisplayShells = sinon.spy();

      initController();

      expect(contactAddressbookService.listAddressbooks).to.have.been.called;
      expect(contactAddressbookDisplayService.convertShellsToDisplayShells).to.have.been.calledOnce;
      expect(contactAddressbookDisplayService.sortAddressbookDisplayShells).to.have.been.calledOnce;
    });

    it('should add new address book when created address book event is fired', function() {
      var addressbooks = [
        {
          displayName: 'bookA',
          priority: 1
        },
        {
          displayName: 'bookB',
          priority: 10
        }
      ];
      var createdAddressbook = {
        displayName: 'bookC',
        priority: 5
      };

      contactAddressbookDisplayService.convertShellsToDisplayShells = angular.noop;
      contactAddressbookDisplayService.convertShellToDisplayShell = sinon.spy(function(addressbook) {
        return addressbook;
      });
      contactAddressbookDisplayService.sortAddressbookDisplayShells = sinon.spy(function(addressbooks) {
        return addressbooks;
      });

      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when());
      var controller = initController();

      controller.addressbooks = addressbooks;
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.CREATED, createdAddressbook);
      $rootScope.$digest();

      expect(controller.addressbooks.length).to.equal(3);
      expect(contactAddressbookDisplayService.convertShellToDisplayShell).to.have.been.calledOnce;
      expect(contactAddressbookDisplayService.sortAddressbookDisplayShells).to.have.been.calledTwice; // First time when init controller
    });
  });

  it('should update an address book when updated address book event is fired', function() {
    var addressbooks = [
      {
        shell: { bookName: 'bookA', name: 'bookA' },
        displayName: 'bookA'
      },
      {
        shell: { bookName: 'bookB', name: 'bookB' },
        displayName: 'bookB'
      }
    ];
    var updatedAddressbook = {
      bookName: 'bookA',
      name: 'new bookA'
    };

    contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when());
    contactAddressbookDisplayService.convertShellsToDisplayShells = angular.noop;
    contactAddressbookDisplayService.sortAddressbookDisplayShells = angular.noop;

    var controller = initController();

    controller.addressbooks = addressbooks;
    $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, updatedAddressbook);
    $rootScope.$digest();

    expect(controller.addressbooks).to.deep.equal([{
      shell: { bookName: 'bookA', name: 'new bookA' },
      displayName: 'new bookA'
    }, {
      shell: { bookName: 'bookB', name: 'bookB' },
      displayName: 'bookB'
    }]);
  });

  it('should remove an address book when removed address book event is fired', function() {
    var addressbooks = [
      {
        shell: { bookName: 'bookA', name: 'bookA' },
        displayName: 'bookA'
      },
      {
        shell: { bookName: 'bookB', name: 'bookB' },
        displayName: 'bookB'
      }
    ];
    var removedAddressbook = 'bookA';

    contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when());
    contactAddressbookDisplayService.convertShellsToDisplayShells = angular.noop;
    contactAddressbookDisplayService.sortAddressbookDisplayShells = angular.noop;

    var controller = initController();

    controller.addressbooks = addressbooks;
    $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, removedAddressbook);
    $rootScope.$digest();

    expect(controller.addressbooks).to.deep.equal([{
      shell: { bookName: 'bookB', name: 'bookB' },
      displayName: 'bookB'
    }]);
  });
});
