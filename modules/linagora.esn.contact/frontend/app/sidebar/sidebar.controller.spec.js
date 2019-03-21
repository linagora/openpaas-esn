'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactSidebarController controller', function() {
  var $rootScope, $controller;
  var contactAddressbookService, contactAddressbookDisplayService, esnConfigMock;
  var userAPI, userUtils;
  var CONTACT_ADDRESSBOOK_EVENTS;

  beforeEach(function() {
    module('linagora.esn.contact');
    module(function($provide) {
      esnConfigMock = function() {
        return $q.when(true);
      };

      $provide.value('esnConfig', esnConfigMock);
    });

    inject(function(
      _$controller_,
      _$rootScope_,
      _contactAddressbookDisplayService_,
      _contactAddressbookService_,
      _userAPI_,
      _userUtils_,
      _CONTACT_ADDRESSBOOK_EVENTS_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
      contactAddressbookService = _contactAddressbookService_;
      userAPI = _userAPI_;
      userUtils = _userUtils_;
      CONTACT_ADDRESSBOOK_EVENTS = _CONTACT_ADDRESSBOOK_EVENTS_;

      contactAddressbookDisplayService.categorizeDisplayShells = function() {
        return {
          userAddressbooks: [],
          externalAddressbooks: []
        };
      };
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
    it('should set status to "loading"', function() {
      var controller = $controller('ContactSidebarController', { $scope: $rootScope.$new() });

      controller.$onInit();

      expect(controller.status).to.equal('loading');
    });

    it('should set status to "loaded" after success to load address books', function() {
      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when([]));

      var controller = initController();

      expect(controller.status).to.equal('loaded');
    });

    it('should set status to "error" after failed to load address books', function() {
      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.reject('an error'));

      var controller = initController();

      expect(controller.status).to.equal('error');
    });

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
      contactAddressbookDisplayService.convertShellsToDisplayShells = sinon.spy(function() { return $q.when(addressbooks); });

      initController();

      expect(contactAddressbookService.listAddressbooks).to.have.been.called;
      expect(contactAddressbookDisplayService.convertShellsToDisplayShells).to.have.been.calledOnce;
    });

    it('should inject owner to addressbooks which are subscription but not group', function() {
      var groupSubscription = {
        name: 'Subscription 4',
        source: { bookId: 'group1' },
        isSubscription: true,
        group: { type: 'domain', id: 'group1' }
      };
      var addressbooks = [{
        name: 'Subscription 1',
        source: { bookId: 'user1' },
        isSubscription: true
      }, {
        name: 'Subscription 2',
        source: { bookId: 'user1' },
        isSubscription: true
      }, {
        name: 'Subscription 3',
        source: { bookId: 'user3' },
        isSubscription: true
      }, {
        name: 'Normal Addressbook'
      },
      groupSubscription];

      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when(addressbooks));
      contactAddressbookDisplayService.sortAddressbookDisplayShells = function(shells) { return shells; };
      contactAddressbookDisplayService.convertShellsToDisplayShells = function(shells) { return $q.when(shells); };
      userAPI.user = sinon.spy(function(userId) {
        return $q.when({
          data: userId
        });
      });
      userUtils.displayNameOf = sinon.spy(function(user) { return user; });

      var controller = initController();

      expect(userAPI.user).to.have.been.calledTwice;
      expect(userUtils.displayNameOf).to.have.been.calledTwice;
      expect(controller.displayShells).to.shallowDeepEqual([{
        name: 'Subscription 1',
        source: {
          bookId: 'user1'
        },
        owner: {
          id: 'user1',
          displayName: 'user1'
        }
      }, {
        name: 'Subscription 2',
        source: {
          bookId: 'user1'
        },
        owner: {
          id: 'user1',
          displayName: 'user1'
        }
      }, {
        name: 'Subscription 3',
        source: {
          bookId: 'user3'
        },
        owner: {
          id: 'user3',
          displayName: 'user3'
        }
      }, {
        name: 'Normal Addressbook'
      },
      groupSubscription]);
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

      contactAddressbookDisplayService.convertShellsToDisplayShells = function() { return $q.when(addressbooks); };
      contactAddressbookDisplayService.convertShellToDisplayShell = sinon.spy(function(addressbook) {
        return addressbook;
      });

      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when([]));
      var controller = initController();

      controller.displayShells = addressbooks;
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.CREATED, createdAddressbook);
      $rootScope.$digest();

      expect(controller.displayShells.length).to.equal(3);
      expect(contactAddressbookDisplayService.convertShellToDisplayShell).to.have.been.calledOnce;
    });
  });

  it('should add new subscription address book when user successfully subscribes to an address book', function() {
    var addressbooks = [
      {
        name: 'bookA'
      }
    ];
    var subscribedAddressbook = {
      name: 'subscription',
      source: { bookId: 'user3' },
      isSubscription: true
    };

    contactAddressbookDisplayService.convertShellToDisplayShell = sinon.spy(function(addressbook) {
      return addressbook;
    });
    userAPI.user = sinon.spy(function(userId) {
      return $q.when({
        data: userId
      });
    });
    userUtils.displayNameOf = sinon.spy(function(user) { return user; });

    contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when([]));
    var controller = initController();

    controller.displayShells = addressbooks;
    $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.CREATED, subscribedAddressbook);
    $rootScope.$digest();

    expect(controller.displayShells).to.shallowDeepEqual([
      {
        name: 'bookA'
      },
      {
        name: 'subscription',
        source: { bookId: 'user3' },
        owner: {
          id: 'user3',
          displayName: 'user3'
        }
      }
    ]);
  });

  describe('On updated address book event', function() {
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

      contactAddressbookService.listAddressbooks = function() {
        return $q.when([]);
      };
      contactAddressbookDisplayService.convertShellsToDisplayShells = function() {
        return $q.when(addressbooks);
      };
      contactAddressbookDisplayService.sortAddressbookDisplayShells = angular.noop;

      var controller = initController();

      controller.displayShells = addressbooks;
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, updatedAddressbook);
      $rootScope.$digest();

      expect(controller.displayShells).to.deep.equal([{
        shell: { bookName: 'bookA', name: 'new bookA' },
        displayName: 'new bookA'
      }, {
        shell: { bookName: 'bookB', name: 'bookB' },
        displayName: 'bookB'
      }]);
    });

    it('should update an subscription address book when updated address book event is fired', function() {
      var user = {
        id: '123',
        name: 'foo'
      };
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
        bookName: 'bookB',
        name: 'new bookB',
        source: { bookId: user.id },
        isSubscription: true
      };

      userAPI.user = sinon.stub().returns($q.when({ data: user }));
      userUtils.displayNameOf = sinon.spy(function(user) { return user.name; });

      contactAddressbookService.listAddressbooks = function() {
        return $q.when([]);
      };
      contactAddressbookDisplayService.convertShellsToDisplayShells = function() {
        return $q.when(addressbooks);
      };
      contactAddressbookDisplayService.sortAddressbookDisplayShells = angular.noop;

      var controller = initController();

      controller.displayShells = addressbooks;
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, updatedAddressbook);
      $rootScope.$digest();

      expect(userAPI.user).to.have.calledOnce;
      expect(userAPI.user).to.have.calledWith(user.id);
      expect(userUtils.displayNameOf).to.have.calledOnce;
      expect(userUtils.displayNameOf).to.have.calledWith(user);
      expect(controller.displayShells).to.deep.equal([{
        shell: { bookName: 'bookA', name: 'bookA' },
        displayName: 'bookA'
      }, {
        shell: {
          bookName: 'bookB',
          name: 'new bookB',
          isSubscription: true,
          owner: {
            id: user.id,
            displayName: user.name
          },
          source: { bookId: user.id }
        },
        displayName: 'new bookB'
      }]);
    });
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
    var removedAddressbook = {
      bookName: 'bookA'
    };

    contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when([]));
    contactAddressbookDisplayService.convertShellsToDisplayShells = function() {return $q.when(addressbooks);};
    contactAddressbookDisplayService.sortAddressbookDisplayShells = angular.noop;

    var controller = initController();

    controller.displayShells = addressbooks;
    $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, removedAddressbook);
    $rootScope.$digest();

    expect(controller.displayShells).to.deep.equal([{
      shell: { bookName: 'bookB', name: 'bookB' },
      displayName: 'bookB'
    }]);
  });

  it('should remove an shared address book when removed address book subscription event is fired', function() {
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
    var removedAddressbook = {
      bookName: 'bookA'
    };

    contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when([]));
    contactAddressbookDisplayService.convertShellsToDisplayShells = function() {return $q.when(addressbooks);};
    contactAddressbookDisplayService.sortAddressbookDisplayShells = angular.noop;

    var controller = initController();

    controller.displayShells = addressbooks;
    $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, removedAddressbook);
    $rootScope.$digest();

    expect(controller.displayShells).to.deep.equal([{
      shell: { bookName: 'bookB', name: 'bookB' },
      displayName: 'bookB'
    }]);
  });
});
