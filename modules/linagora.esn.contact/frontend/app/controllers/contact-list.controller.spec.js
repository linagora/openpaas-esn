'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactListController controller', function() {
  var $rootScope, $controller, $timeout, $state, $stateParams, $alert;
  var AddressBookPaginationService, AddressBookPaginationRegistryMock, contactAddressbookService, contactAddressbookDisplayService,
    contactUpdateDataService, gracePeriodService, sharedContactDataService;
  var CONTACT_ADDRESSBOOK_EVENTS, CONTACT_EVENTS, CONTACT_LIST_DISPLAY_MODES, DEFAULT_ADDRESSBOOK_NAME;
  var addressbooks, scope, sortedContacts, openContactFormMock;

  beforeEach(function() {
    addressbooks = [];
    $alert = {
      alert: function() {}
    };
    gracePeriodService = {
      askUserForCancel: function() {
        return {promise: $q.when({})};
      },
      grace: function() {
        return {
          then: function() {}
        };
      },
      cancel: function() {},
      flush: function() {}
    };

    contactUpdateDataService = { contact: null, taskId: null, contactUpdatedIds: [] };

    AddressBookPaginationService = function(pagination) {
      this.pagination = pagination;
    };

    AddressBookPaginationService.prototype.loadNextItems = function(options) {
      if (this.pagination && this.pagination.loadNextItems) {
        return this.pagination.loadNextItems(options);
      }

      return $q.when({data: []});
    };

    AddressBookPaginationRegistryMock = {
      get: function() {
        return function Mock() {
        };
      },
      put: function() {}
    };

    openContactFormMock = sinon.spy();
    angular.mock.module('esn.core');

    module('linagora.esn.contact', function($provide) {
      $provide.value('$alert', function(options) { $alert.alert(options); });
      $provide.value('gracePeriodService', gracePeriodService);
      $provide.value('contactUpdateDataService', contactUpdateDataService);
      $provide.value('AddressBookPaginationService', AddressBookPaginationService);
      $provide.value('AddressBookPaginationRegistry', AddressBookPaginationRegistryMock);
      $provide.value('openContactForm', openContactFormMock);
    });
  });

  beforeEach(angular.mock.inject(function(
    _$rootScope_,
    _$controller_,
    _$timeout_,
    _$state_,
    _$stateParams_,
    _sharedContactDataService_,
    _contactAddressbookService_,
    _contactAddressbookDisplayService_,
    _openContactForm_,
    ALPHA_ITEMS,
    _CONTACT_EVENTS_,
    _CONTACT_LIST_DISPLAY_MODES_,
    _CONTACT_ADDRESSBOOK_EVENTS_,
    _DEFAULT_ADDRESSBOOK_NAME_
  ) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    $state = _$state_;
    $stateParams = _$stateParams_;
    sharedContactDataService = _sharedContactDataService_;
    contactAddressbookService = _contactAddressbookService_;
    contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(addressbooks));
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    sortedContacts = ALPHA_ITEMS.split('').reduce(function(a, b) {
      a[b] = [];

      return a;
    }, {});

    scope = $rootScope.$new();
    scope.contact = {};
    contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;
    CONTACT_EVENTS = _CONTACT_EVENTS_;
    CONTACT_LIST_DISPLAY_MODES = _CONTACT_LIST_DISPLAY_MODES_;
    CONTACT_ADDRESSBOOK_EVENTS = _CONTACT_ADDRESSBOOK_EVENTS_;
    DEFAULT_ADDRESSBOOK_NAME = _DEFAULT_ADDRESSBOOK_NAME_;
  }));

  function createPaginationMocks(singleFn, searchFn) {

    function SingleMock(options) {
      this.options = options;
    }
    SingleMock.prototype.loadNextItems = singleFn;

    function AggregateMock(options) {
      this.options = options;
    }
    AggregateMock.prototype.loadNextItems = singleFn;

    function SearchMock(options) {
      this.options = options;
    }
    SearchMock.prototype.loadNextItems = searchFn;

    var mocks = {
      single: SingleMock,
      search: SearchMock,
      multiple: AggregateMock
    };

    AddressBookPaginationRegistryMock.get = function(type) {
      return mocks[type];
    };
  }

  function initController(AlphaCategoryService) {
    var AlphaCategoryServiceMock = function() {
      return {
        init: angular.noop,
        addItems: angular.noop,
        get: angular.noop
      };
    };
    var controller = $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      },
      AlphaCategoryService: AlphaCategoryService || AlphaCategoryServiceMock
    });

    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should set status to "loading"', function() {
      var controller = initController();

      expect(controller.status).to.equal('loading');
    });

    it('should call contactAddressbookService.listAggregatedAddressbooks to get all address books if bookName is blank', function() {
      $stateParams.bookName = '';
      contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when([]));
      initController();

      expect(contactAddressbookService.listAggregatedAddressbooks).to.have.been.called;
    });

    it('should call contactAddressbookService.getAddressbookByBookName to get specific address books if bookName is provided', function() {
      $stateParams.bookName = 'bookName';
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when([]));
      initController();

      expect(contactAddressbookService.getAddressbookByBookName).to.have.been.calledWith('bookName');
    });

    it('should set status to "error" if failed to load address books', function() {
      contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.reject('an error'));
      var controller = initController();

      expect(controller.status).to.equal('error');
    });

    it('should get total contacts count of current viewing addressbooks', function() {
      var addressbooksList = [
        { numberOfContacts: 10 },
        { numberOfContacts: 1023 }
      ];

      contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(addressbooksList));
      initController();

      expect(scope.contactsCount).to.equal(1023 + 10);
    });
  });

  it('should display contacts as list by default', inject(function(CONTACT_LIST_DISPLAY) {
    $controller('ContactListController', {
      $scope: scope,
      user: { _id: '123' }
    });

    expect(scope.displayAs).to.equal(CONTACT_LIST_DISPLAY.list);
  }));

  it('should display create contact button if user is viewing all contacts', function() {
    var currentAddressbooks = [{
      bookName: 'contacts',
      canCreateContact: true
    }, {
      bookName: 'twitter',
      canCreateContact: false
    }];

    contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(currentAddressbooks));

    initController();

    expect(scope.canCreateContact).to.equal(true);
  });

  it('should display create contact button if current address book can create contact', function() {
    $stateParams.bookName = 'contacts';
    var currentAddressbooks = [{
      bookName: 'contacts',
      canCreateContact: true
    }];

    contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

    initController();

    expect(scope.canCreateContact).to.equal(true);
  });

  it('should not display create contact button if current address book cannot create contact', function() {
    $stateParams.bookName = 'twitter';
    var currentAddressbooks = [{
      bookName: 'twitter',
      editable: false
    }];

    contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

    initController();

    expect(scope.canCreateContact).to.equal(false);
  });

  it('should store the search query when user switches to contact view', function() {
    scope.contactSearch = {
      searchInput: 'some query'
    };
    sharedContactDataService.searchQuery = null;
    $controller('ContactListController', {
      $scope: scope,
      user: { _id: '123' }
    });
    scope.$emit('$stateChangeStart', {
      name: '/contact/show/:bookId/:bookName/:cardId'
    });
    expect(sharedContactDataService.searchQuery).to.equal(scope.contactSearch.searchInput);
  });

  it('should store the search query when user switches to contact edition view', function() {
    scope.contactSearch = {
      searchInput: 'some query'
    };
    sharedContactDataService.searchQuery = null;
    $controller('ContactListController', {
      $scope: scope,
      user: { _id: '123' }
    });
    scope.$emit('$stateChangeStart', {
      name: '/contact/edit/:bookId/:bookName/:cardId'
    });
    expect(sharedContactDataService.searchQuery).to.equal(scope.contactSearch.searchInput);
  });

  it('should clear the search query when user switches to a view that is not contact view nor contact edition view', function() {
    sharedContactDataService.searchQuery = '';
    $controller('ContactListController', {
      $scope: scope,
      user: { _id: '123' }
    });
    scope.$emit('$stateChangeStart', {
      name: '/this/is/not/contact/show/or/edit/:bookId/:cardId'
    });
    expect(sharedContactDataService.searchQuery).to.be.null;
  });

  it('should gracePeriodService.flushAllTasks $on(\'$destroy\')', function() {

    createPaginationMocks(function() {
      return $q.reject('WTF');
    });

    gracePeriodService.flushAllTasks = sinon.spy();
    contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when([]));

    initController();

    scope.$destroy();
    $rootScope.$digest();
    expect(gracePeriodService.flushAllTasks).to.have.been.called;
  });

  it('should register gracePeriodService.flushAllTasks on(\'beforeunload\')', function() {
    gracePeriodService.flushAllTasks = 'aHandler';
    var event = null;
    var handler = null;
    var window = {
      addEventListener: function(evt, hdlr) {
        event = evt;
        handler = hdlr;
      }
    };

    createPaginationMocks(function() {
      return $q.reject('Fail');
    });

    $controller('ContactListController', {
      $scope: scope,
      $window: window,
      user: {
        _id: '123'
      }
    });
    $rootScope.$digest();
    expect(event).to.equal('beforeunload');
    expect(handler).to.equal('aHandler');
  });

  it('should add the contact to the list on delete cancellation', function(done) {
    var contact = {
      lastName: 'Last'
    };
    var query = null;
    var locationMock = {
      search: function() {
        return {
          q: query
        };
      }
    };
    $controller('ContactListController', {
      $scope: scope,
      $location: locationMock,
      user: {
        _id: '123'
      },
      AlphaCategoryService: function() {
        return {
          addItems: function(data) {
            expect(data).to.deep.equal([contact]);

            done();
          },
          get: function() {}
        };
      }
    });

    $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
    $rootScope.$digest();
  });

  it('should hide contact on CONTACT_EVENTS.DELETED while in search mode', function() {
    var contact = { lastName: 'Last' };
    $controller('ContactListController', {
      $scope: scope,
      user: { _id: '123' }
    });

    scope.contactSearch.searchInput = 'someQuery';
    $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
    expect(contact.deleted).to.be.true;
  });

  it('should show contact on CONTACT_EVENTS.CANCEL_DELETE while in search mode', function() {
    var contact = { lastName: 'Last' };
    $controller('ContactListController', {
      $scope: scope,
      user: { _id: '123' }
    });

    scope.contactSearch.searchInput = 'someQuery';
    $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
    expect(contact.deleted).to.be.false;
  });

  it('should add the contact to the contact list of addressbook on CONTACT_EVENTS.CREATED event', function() {
    var bookName = 'foobar';
    var currentAddressbooks = [{ bookId: 'foo', bookName: bookName }];
    var contact = {
      lastName: 'Last',
      addressbook: currentAddressbooks[0]
    };
    var addItemsMock = sinon.spy();
    var AlphaCategoryService = function() {
      return {
        addItems: addItemsMock,
        get: function() {}
      };
    };

    $stateParams.bookName = bookName;
    contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

    initController(AlphaCategoryService);

    $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    $rootScope.$digest();
    expect(addItemsMock).to.have.been.calledWith([contact]);
  });

  it('should add the contact to the all contacts list on CONTACT_EVENTS.CREATED event', function() {
    var currentAddressbooks = [{ bookId: 'foobar', bookName: 'bookName1' }, { bookId: 'foobar', bookName: 'bookName2' }];
    var contact = {
      lastName: 'Last',
      addressbook: currentAddressbooks[0]
    };
    var addItemsMock = sinon.spy();
    var AlphaCategoryService = function() {
      return {
        addItems: addItemsMock,
        get: function() {}
      };
    };

    contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(currentAddressbooks));

    initController(AlphaCategoryService);

    scope.contactSearch.searchInput = null;
    $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    $rootScope.$digest();
    expect(addItemsMock).to.have.been.calledWith([contact]);
  });

  it('should not add the contact to the contact list of other addressbooks on CONTACT_EVENTS.CREATED event', function() {
    var userId = '123';
    var currentAddressbooks = [{ bookId: userId, bookName: 'bookName1' }];
    var contact = {
      lastName: 'Last',
      addressbook: {
        bookId: userId,
        bookName: 'bookName2'
      }
    };
    var addItemsMock = sinon.spy();
    var AlphaCategoryService = function() {
      return {
        addItems: addItemsMock,
        get: function() {}
      };
    };

    $stateParams.bookName = 'bookName1';
    contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

    initController(AlphaCategoryService);

    scope.contactSearch.searchInput = null;
    $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    $rootScope.$digest();

    expect(addItemsMock).to.not.have.been.calledWith([contact]);
  });

  it('should not live refresh the search result list', function() {
    var currentAddressbooks = [{ bookId: 'foo', bookName: 'bar' }];
    var contact = {
      lastName: 'Last',
      addressbook: currentAddressbooks[0]
    };

    var mySpy = sinon.spy();
    var addItemsSpy = sinon.spy();
    var AlphaCategoryService = function() {
      return {
        addItems: addItemsSpy,
        removeItemWithId: mySpy,
        replaceItem: mySpy,
        get: function() {}
      };
    };

    contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(currentAddressbooks));

    initController(AlphaCategoryService);

    scope.contactSearch.searchInput = 'someQuery';
    $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
    $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
    $rootScope.$digest();
    expect(addItemsSpy).to.not.have.been.calledWith([contact]);
    expect(mySpy).to.have.been.callCount(0);
  });

  it('should update the contact in all contacts list on CONTACT_EVENTS.UPDATED event', function() {
    var userId = '123';
    var currentAddressbooks = [{ bookId: userId, bookName: 'bookName1' }, { bookId: userId, bookName: 'bookName2' }];
    var contact = {
      id: '123456',
      lastName: 'Last',
      addressbook: currentAddressbooks[0]
    };
    var replaceItemMock = sinon.spy();
    var AlphaCategoryService = function() {
      return {
        addItems: function() {},
        get: function() {},
        replaceItem: replaceItemMock
      };
    };

    contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(currentAddressbooks));

    initController(AlphaCategoryService);

    $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
    $rootScope.$digest();
    $timeout.flush();
    expect(replaceItemMock).to.have.been.calledWith(contact);
  });

  it('should update the contact in the contacts list of addressbook on CONTACT_EVENTS.UPDATED event', function() {
    var userId = '123';
    var currentAddressbooks = [{ bookId: userId, bookName: 'bookName1' }];
    var contact = {
      id: '123456',
      lastName: 'Last',
      addressbook: currentAddressbooks[0]
    };
    var replaceItemMock = sinon.spy();
    var AlphaCategoryService = function() {
      return {
        addItems: function() {},
        get: function() {},
        replaceItem: replaceItemMock
      };
    };

    $stateParams.bookName = 'bookName1';
    contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

    initController(AlphaCategoryService);

    $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
    $rootScope.$digest();
    $timeout.flush();
    expect(replaceItemMock).to.have.been.calledWith(contact);
  });

  it('should store contact id in contactUpdatedIds on CONTACT_EVENTS.UPDATED event', function(done) {
    var contact = {
      id: '123456',
      lastName: 'Last'
    };

    $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      },
      contactUpdateDataService: {
        contactUpdatedIds: {
          indexOf: function() {
            return -1;
          },
          push: function() {
            done();
          }
        }
      }
    });

    $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
    $rootScope.$digest();
  });

  it('should load contact list when no query is specified in the URL', function(done) {
    var query = null;
    var locationMock = {
      search: function() {
        return {
          q: query
        };
      }
    };

    createPaginationMocks(function() {
      done();
    }, function() {
      done(new Error('This test should not call search function'));
    });

    $controller('ContactListController', {
      $location: locationMock,
      $scope: scope,
      user: {
        _id: '123'
      }
    });
    $rootScope.$digest();
  });

  it('should not load contact list when no query is specified in the URL and a request is ongoing', function(done) {
    var query = null;
    var locationMock = {
      search: function() {
        return {
          q: query
        };
      }
    };
    scope.loadingNextContacts = true;

    createPaginationMocks(function() {
      done(new Error('This test should not call list function'));
    }, function() {
      done(new Error('This test should not call search function'));
    });

    $controller('ContactListController', {
      $location: locationMock,
      $scope: scope,
      user: {
        _id: '123'
      }
    });
    $rootScope.$digest();
    done();
  });

  it('should load search result list when a query is specified in the URL', function(done) {
    var query = 'Chuck Norris';
    var locationMock = {
      search: function() {
        return {
          q: query
        };
      }
    };

    createPaginationMocks(function() {
      done(new Error('Should not be called'));
    }, function() {
      expect(scope.contactSearch.searchInput).to.equal(query);
      done();
    });

    $controller('ContactListController', {
      $location: locationMock,
      $scope: scope,
      user: {
        _id: '123'
      }
    });
    $rootScope.$digest();
  });

  it('should update the search when a query is stored in sharedContactDataService', function(done) {
    var query = 'Chuck Norris';
    var locationMock = {
      search: function(s, value) {
        if (s) {
          expect(s).to.equal('q');
          expect(value).to.equal('Chuck+Norris');
          done();
        } else {
          return { q: null };
        }
      }
    };

    createPaginationMocks(function() {
      return done(new Error('This test should not call list function'));
    }, function() {
      done();
    });

    $controller('ContactListController', {
      $location: locationMock,
      sharedContactDataService: { searchQuery: query },
      $scope: scope,
      user: {
        _id: '123'
      }
    });
    $rootScope.$digest();
  });

  it('should refresh list on route update when the queries in the URL and in the search input are different', function(done) {
    var query = 'QueryA';
    var mySpy = sinon.spy();
    var locationMock = {
      search: function() {
        return {
          q: query
        };
      }
    };

    createPaginationMocks(function() {
      return done(new Error('This test should not call list function'));
    }, function(options) {
      expect(scope.contactSearch.searchInput).to.equal(options.searchInput);
      mySpy();
      return $q.when({
        data: [],
        total_hits: 0
      });
    });

    $controller('ContactListController', {
      $scope: scope,
      $location: locationMock,
      user: {
        _id: '123'
      }
    });
    scope.$digest();
    scope.contactSearch.searchInput = 'QueryB';
    scope.$digest();
    $rootScope.$broadcast('$stateChangeSuccess', {name: '/some/other/place'});
    expect(scope.contactSearch.searchInput).to.equal(query);
    expect(mySpy).to.have.been.calledTwice;
    done();
  });

  it('should not refresh list on route update when the queries in the URL and in the search input are the same', function(done) {
    var query = 'QueryA';
    var mySpy = sinon.spy();
    var locationMock = {
      search: function() {
        return {
          q: query
        };
      }
    };

    createPaginationMocks(function() {
      return done(new Error('This test should not call list function'));
    }, function() {
      expect(scope.contactSearch.searchInput).to.equal(query);
      mySpy();
      return $q.when([]);
    });

    $controller('ContactListController', {
      $scope: scope,
      $location: locationMock,
      user: {
        _id: '123'
      }
    });
    scope.$digest();
    scope.contactSearch.searchInput = 'QueryA';
    $rootScope.$broadcast('$stateChangeSuccess', {});
    expect(scope.contactSearch.searchInput).to.equal(query);
    expect(mySpy).to.have.been.calledOnce;
    done();
  });

  it('should add no item to the categories when pagination returns an empty list', function(done) {

    createPaginationMocks(function() {
      return $q.when({data: []});
    }, function() {
      done(new Error('Should not be called'));
    });

    $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      }
    });
    $rootScope.$digest();

    $rootScope.$digest();
    expect(scope.sorted_contacts).to.deep.equal(sortedContacts);
    done();
  });

  it('should sort contacts by FN', function(done) {
    var contactWithA = { displayName: 'A B'},
        contactWithC = { displayName: 'C D' };

    createPaginationMocks(function() {
      return $q.when({data: [contactWithA, contactWithC]});
    }, function() {
      done(new Error('Should not be called'));
    });

    $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      }
    });

    sortedContacts.A = [contactWithA];
    sortedContacts.C = [contactWithC];

    $rootScope.$digest();

    $timeout(function() {
      expect(scope.sorted_contacts).to.deep.equal(sortedContacts);
      done();
    });
    $timeout.flush();
  });

  it('should correctly sort contacts when multiple contacts have the same FN', function(done) {
    var contact1 = { id: 1, displayName: 'A B'},
        contact2 = { id: 2, displayName: 'A B' };

    createPaginationMocks(function() {
      return $q.when({data: [contact1, contact2]});
    }, function() {
      done(new Error('Should not be called'));
    });

    $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      }
    });

    sortedContacts.A = [contact1, contact2];

    $rootScope.$digest();

    $timeout(function() {
      expect(scope.sorted_contacts).to.deep.equal(sortedContacts);
      done();
    });
    $timeout.flush();
  });

  it('should correctly sort contacts when multiple contacts have the same beginning of FN', function(done) {
    var contact1 = { displayName: 'A B'},
        contact2 = { displayName: 'A C' };

    createPaginationMocks(function() {
      return $q.when({data: [contact1, contact2]});
    }, function() {
      done(new Error('Should not be called'));
    });

    $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      }
    });

    sortedContacts.A = [contact1, contact2];

    $rootScope.$digest();

    $timeout(function() {
      expect(scope.sorted_contacts).to.deep.equal(sortedContacts);
      done();
    });
    $timeout.flush();
  });

  it('should correctly sort contacts when some contacts does not have FN', function(done) {
    var contact1 = { firstName: 'A'},
        contact2 = { displayName: 'A C'},
        contact3 = { id: '123' };

    createPaginationMocks(function() {
      return $q.when({data: [contact1, contact2, contact3]});
    }, function() {
      done(new Error('Should not be called'));
    });

    $controller('ContactListController', {
      $scope: scope,
      user: {
        _id: '123'
      }
    });

    sortedContacts.A = [{displayName: contact1.firstName, firstName: contact1.firstName}, contact2];
    sortedContacts['#'] = [{displayName: contact3.id, id: contact3.id}];

    $rootScope.$digest();

    $timeout(function() {
      expect(scope.sorted_contacts).to.deep.equal(sortedContacts);
      done();
    });
    $timeout.flush();
  });

  describe('The createPagination function', function() {

    var user = {
      _id: 1
    };

    it('should set the $scope.mode', function() {
      createPaginationMocks(function() {
        return $q.when([]);
      });

      $controller('ContactListController', {
        $scope: scope,
        user: user
      });
      var mode = CONTACT_LIST_DISPLAY_MODES.single;
      scope.createPagination(mode);
      expect(scope.mode).to.equal(mode);
    });

    it('should call pagination#init', function(done) {
      addressbooks.push({id: 1, name: 'foo'});
      addressbooks.push({id: 2, name: 'bar'});
      var mode = CONTACT_LIST_DISPLAY_MODES.list;

      initController();

      scope.pagination.init = function(_mode, _options) {
        expect(_mode).to.equal(mode);
        expect(_options.user).to.exist;
        expect(_options.addressbooks).to.deep.equal(addressbooks);
        done();
      };
      scope.createPagination(mode);
      done(new Error());
    });
  });

  describe('The clearSearchInput function', function() {

    it('should clear search input and all search results', function() {
      var user = {_id: 123};
      scope.contactSearch = {
        searchInput: 'name'
      };
      scope.searchResult = {
        data: ['name1', 'name2', 'name3']
      };
      scope.totalHits = 3;
      scope.loadContacts = function() {};
      $controller('ContactListController', {
        $scope: scope,
        user: user
      });
      scope.clearSearchInput();
      expect(scope.contactSearch.searchInput).to.be.null;
      expect(scope.searchResult).to.deep.equal({});
      expect(scope.totalHits).to.equal(0);
    });

    it('should load contacts after clear input', function(done) {
      var user = {_id: 123};

      createPaginationMocks(function() {
        done();
      }, function() {
        done(new Error('Should not be called'));
      });

      scope.loadContacts = sinon.spy();
      $controller('ContactListController', {
        $scope: scope,
        user: user
      });
      scope.clearSearchInput();
      $rootScope.$digest();
    });

    it('should update location after clear input', function(done) {
      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
      scope.appendQueryToURL = done;
      scope.clearSearchInput();
      $rootScope.$digest();
    });
  });

  describe('The loadContacts function', function() {

    it('should call the addressBookPaginationService vcard list fn', function(done) {
      var user = {_id: 123};

      createPaginationMocks(function() {
        done();
      }, function() {
        done(new Error('Should not be called'));
      });

      $controller('ContactListController', {
        $scope: scope,
        user: user
      });
      scope.loadContacts();
      $rootScope.$digest();
    });

    it('should set status to "loading"', function() {
      contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when([]));
      var controller = initController();

      $timeout.flush();
      expect(controller.status).to.equal('loaded');

      scope.loadContacts();
      $rootScope.$digest();
      expect(controller.status).to.equal('loading');
    });

    it('should set status to "loaded" after contacts are loaded', function() {
      contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when([]));
      var controller = initController();

      $timeout.flush();
      expect(controller.status).to.equal('loaded');

      scope.loadContacts();
      $rootScope.$digest();
      expect(controller.status).to.equal('loading');

      $timeout.flush();
      expect(controller.status).to.equal('loaded');
    });

    it('should display error when pagination fails', function(done) {
      var user = {_id: 123};

      createPaginationMocks(function() {
        return $q.reject('WTF');
      }, function() {
        done(new Error('Should not be called'));
      });

      $alert.alert = function(options) {
        expect(options.content).to.match(/Can not get contacts/);
        done();
      };

      $controller('ContactListController', {
        $scope: scope,
        user: user
      });

      scope.loadContacts();
      scope.$digest();
    });
  });

  describe('The openContactCreation function', function() {
    it('should open create form for default address book if user clicks on create contact button while viewing all contacts', function() {
      var currentAddressbooks = [{
        bookName: 'twitter',
        editable: false
      }, {
        bookName: 'collected',
        editable: true
      }];

      contactAddressbookService.listAggregatedAddressbooks = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      scope.openContactCreation();
      expect(openContactFormMock).to.have.been.calledWith(scope.bookId, DEFAULT_ADDRESSBOOK_NAME);
    });

    it('should open the contact creation form for specific address book if user is viewing that address book', function() {
      var bookName = 'foobar';

      $stateParams.bookName = bookName;
      addressbooks = [{ bookName: bookName }];
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(addressbooks));

      initController();

      scope.openContactCreation();
      expect(openContactFormMock).to.have.been.calledWith(scope.bookId, bookName);
    });
  });

  describe('The search function', function() {

    it('should set status to "loading" when searching contacts', function() {
      var controller = initController();

      $timeout.flush();
      expect(controller.status).to.equal('loaded');

      scope.search();
      $rootScope.$digest();
      expect(controller.status).to.equal('loading');
    });

    it('should stop the throbber when finished searching contacts', function() {
      var controller = initController();

      $timeout.flush();
      expect(controller.status).to.equal('loaded');

      scope.search();
      $rootScope.$digest();
      expect(controller.status).to.equal('loading');
      $timeout.flush();
      expect(controller.status).to.equal('loaded');
    });

    it('should clean previous search results', function(done) {
      createPaginationMocks(function() {
        return $q.when([]);
      }, function() {
        done(new Error('Should not be called'));
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });

      scope.searchResult = 1;
      scope.loadContacts = function() {};
      scope.search();
      scope.$digest();
      expect(scope.searchResult).to.deep.equal({});
      done();
    });

    it('should update location on each search', function(done) {
      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
      scope.appendQueryToURL = done;
      scope.search();
    });

    it('should clean search result data', function(done) {
      createPaginationMocks(function() {
        return $q.when({ contacts: [] });
      }, function() {
        done(new Error('Should not be called'));
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        AlphaCategoryService: function() {
          return {
            init: function() {
            }
          };
        }
      });

      scope.searchResult = {
        data: 1
      };
      scope.loadContacts = function() {};
      scope.search();
      scope.$digest();
      expect(scope.searchMode).isTrue;
      expect(scope.searchResult.data).to.not.exist;
      done();
    });

    it('should quit search mode and get all the user contacts when searchInput is undefined', function(done) {
      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });

      scope.loadContacts = function() {
        expect(scope.searchMode).isFalse;
        done();
      };
      scope.search();
      scope.$digest();
    });

    it('should update the contacts list on search success', function() {
      var search = 'Bruce Willis';

      var contactWithA = { displayName: 'A B'};
      var contactWithB = { displayName: 'B C'};
      var contactWithC = { displayName: 'C D'};

      var result = {
        total_hits: 2,
        current_page: 1,
        data: [contactWithA, contactWithC]
      };

      createPaginationMocks(function() {
        return $q.when([contactWithA, contactWithB, contactWithC]);
      }, function() {
        return $q.when(result);
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        bookId: '456'
      });

      scope.contactSearch.searchInput = search;
      scope.totalHits = 0;
      scope.search();
      scope.$digest();

      expect(scope.searchResult.data).to.deep.equal(result.data);
      expect(scope.searchResult.count).to.equal(2);
      expect(scope.searchResult.formattedResultsCount).to.exist;
      expect(scope.searchFailure).to.be.false;
    });

    it('should contactDisplayError on search failure', function(done) {
      var search = 'Bruce Willis';

      createPaginationMocks(function() {
        return $q.when([]);
      }, function() {
        return $q.reject(new Error('Search failure'));
      });

      $controller('ContactListController', {
        $scope: scope,
        contactDisplayError: function(error) {
          expect(error).to.match(/Can not search contacts/);
          done();
        },
        user: {
          _id: '123'
        },
        bookId: '456'
      });

      scope.contactSearch.searchInput = search;
      scope.search();
      scope.$digest();
    });

    it('should prevent fetching next results page while loading current result page', function() {
      var search = 'Bruce Willis';

      var contactWithA = { displayName: 'A B'};
      var contactWithB = { displayName: 'B C'};
      var contactWithC = { displayName: 'C D'};
      var contactWithD = { displayName: 'D E'};
      var contactWithE = { displayName: 'E F'};

      var result = {
        total_hits: 4,
        data: [contactWithA, contactWithB]
      };

      createPaginationMocks(function() {
        return $q.when([contactWithA, contactWithB, contactWithC, contactWithD, contactWithE]);
      }, function() {
        return $q.when(result);
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        bookId: '456'
      });

      scope.contactSearch.searchInput = search;
      scope.search();
      expect(scope.loadingNextContacts).to.be.true;
      scope.$digest();
      expect(scope.searchFailure).to.be.false;
      expect(scope.loadingNextContacts).to.be.false;
    });

    it('should allow fetching next result page when there are undisplayed results', function() {
      var search = 'Bruce Willis';

      var contactWithA = { displayName: 'A B'};
      var contactWithB = { displayName: 'B C'};
      var contactWithC = { displayName: 'C D'};
      var contactWithD = { displayName: 'D E'};
      var contactWithE = { displayName: 'E F'};

      var result = {
        total_hits: 4,
        data: [contactWithA, contactWithB]
      };

      createPaginationMocks(function() {
        return $q.when([contactWithA, contactWithB, contactWithC, contactWithD, contactWithE]);
      }, function() {
        return $q.when(result);
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        bookId: '456'
      });
      scope.$digest();

      scope.contactSearch.searchInput = search;
      scope.totalHits = 0;
      scope.search();
      scope.$digest();
      expect(scope.searchFailure).to.be.false;
      expect(scope.lastPage).to.be.false;
    });

    it('should prevent fetching next result page when the previous search fails', function() {
      var search = 'Bruce Willis';

      createPaginationMocks(function() {
        return $q.when([]);
      }, function() {
        return $q.reject(new Error('Fail'));
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        bookId: '456'
      });

      scope.contactSearch.searchInput = search;
      scope.search();
      scope.$digest();
      expect(scope.searchFailure).to.be.true;
    });

    it('should prevent search when previous search is not complete', function() {
      var search = 'Bruce Willis';
      var called = 0;
      var promise = $q.defer().promise;

      createPaginationMocks(function() {
        return $q.when([]);
      }, function() {
        called++;
        // the search will be never resolved
        return promise;
      });

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        bookId: '456',
        $location: {
          search: function() {
            return {};
          }
        }
      });
      $rootScope.$digest();
      scope.appendQueryToURL = function() {};

      scope.contactSearch.searchInput = search;
      scope.$digest();
      scope.search();
      scope.$digest();
      scope.search();
      scope.$digest();
      expect(called).to.equal(1);
    });

    it('should store the search input value if the previous search request is still pending', function() {
      var endOfSearch = $q.defer();

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
      $rootScope.$digest();

      scope.appendQueryToURL = scope.createPagination = angular.noop;

      scope.pagination.service.loadNextItems = function(searchQuery) {
        if (searchQuery) {
          return endOfSearch.promise;
        }
        return $q.reject(new Error('Fail'));
      };

      scope.contactSearch.searchInput = 'openpaas';
      scope.search();
      scope.$digest();

      scope.contactSearch.searchInput = 'openpaasng';
      scope.search();
      scope.$digest();

      expect(scope.updatedDuringSearch).to.equal('openpaasng');
    });

    it('should reset the stored value if a new search request occurs and no changes occured between', function() {
      var endOfSearch;
      var fakeResult = {
        total_hits: 0,
        data: []
      };

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
      $rootScope.$digest();

      scope.appendQueryToURL = scope.createPagination = angular.noop;

      scope.pagination.service.loadNextItems = function(searchQuery) {
        if (searchQuery) {
          endOfSearch = $q.defer();
          return endOfSearch.promise;
        }
        return $q.reject(new Error('Fail'));
      };

      scope.contactSearch.searchInput = 'openpaas';
      scope.search();
      scope.$digest();

      endOfSearch.resolve(fakeResult);
      scope.search();
      scope.$digest();

      expect(scope.updatedDuringSearch).to.be.null;
    });

    it('should send a new query search if a stored value exists', function() {
      var endOfSearch;
      var fakeResult = {
        total_hits: 0,
        data: []
      };
      var searchRequests = 0;

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
      $rootScope.$digest();

      scope.appendQueryToURL = scope.createPagination = angular.noop;

      scope.pagination.service.loadNextItems = function(searchQuery) {
        if (searchQuery) {
          searchRequests++;
          endOfSearch = $q.defer();
          return endOfSearch.promise;
        }
        return $q.reject(new Error('Fail'));
      };

      scope.contactSearch.searchInput = 'openpaas';
      scope.search();
      scope.$digest();
      scope.contactSearch.searchInput = 'openpaasng';
      endOfSearch.resolve(fakeResult);
      scope.search();
      scope.$digest();

      expect(searchRequests).to.equal(2);
    });

    it('should not send a new query search if no changes occured during a search query', function() {
      var endOfSearch;
      var fakeResult = {
        total_hits: 0,
        data: []
      };
      var searchRequests = 0;

      $controller('ContactListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
      $rootScope.$digest();

      scope.appendQueryToURL = scope.createPagination = angular.noop;

      scope.pagination.service.loadNextItems = function(searchQuery) {
        if (searchQuery) {
          searchRequests++;
          endOfSearch = $q.defer();
          return endOfSearch.promise;
        }
        return $q.reject(new Error('Fail'));
      };

      scope.contactSearch.searchInput = 'openpaas';
      scope.search();
      scope.$digest();
      endOfSearch.resolve(fakeResult);

      expect(searchRequests).to.equal(1);
    });

  });

  describe('When Deleted Addressbook event is fired', function() {
    it('should change to aggregated contacts view if the current viewing addressbook is deleted', function() {
      var bookName = 'twitter';
      var currentAddressbooks = [{
        bookName: bookName
      }];

      $state.go = sinon.spy();

      $stateParams.bookName = bookName;
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, { bookName: bookName });
      expect($state.go).to.have.been.calledWith('contact.addressbooks', { bookName: null });
    });

    it('should not change state if the current viewing addressbook is not the one is deleted', function() {
      var currentAddressbooks = [{
        bookName: 'twitter',
        name: 'Twitter Contacts'
      }];

      $state.go = sinon.spy();
      $controller('ContactListController', {
        $scope: scope,
        user: { _id: '123' },
        addressbooks: currentAddressbooks
      });
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, { bookName: 'google' });
      expect($state.go).to.not.have.been.called;
    });
  });

  describe('When Updated Addressbook event is fired', function() {
    it('should update addressbook title in subheader if the current viewing addressbook is updated', function() {
      var currentAddressbooks = [{
        bookName: 'twitter'
      }];

      $stateParams.bookName = 'twitter';
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, {
        name: 'Twitter Contacts',
        bookName: 'twitter'
      });
      expect(scope.bookTitle).to.equal('Twitter Contacts');
    });

    it('should not update addressbook title in subheader if the current viewing addressbook is not the one is updated', function() {
      var currentAddressbooks = [{
        bookName: 'twitter',
        name: 'Twitter Contacts'
      }];

      $stateParams.bookName = 'twitter';
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, {
        name: 'Google Contacts',
        bookName: 'goole'
      });
      expect(scope.bookTitle).to.equal('Twitter Contacts');
    });
  });

  describe('When deleted addressbook subscription event is fired', function() {
    it('should change to aggregated contacts view if the current viewing addressbook is deleted', function() {
      var bookName = 'twitter';
      var currentAddressbooks = [{
        bookName: bookName
      }];

      $state.go = sinon.spy();

      $stateParams.bookName = bookName;
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, { bookName: bookName });
      expect($state.go).to.have.been.calledWith('contact.addressbooks', { bookName: null });
    });

    it('should not change state if the current viewing addressbook is not the one is deleted', function() {
      var currentAddressbooks = [{
        bookName: 'twitter',
        name: 'Twitter Contacts'
      }];

      $state.go = sinon.spy();
      $controller('ContactListController', {
        $scope: scope,
        user: { _id: '123' },
        addressbooks: currentAddressbooks
      });
      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, { bookName: 'google' });
      expect($state.go).to.not.have.been.called;
    });

    it('should live update contacts in All contacts when a address book is deleted', function() {
      // addressbooks length need to have more than one element when staying All contacts
      addressbooks.push({});
      addressbooks.push({});

      var categories = {
        A: [
          {id: 'contactId1', addressbook: { bookId: 'bookId1', bookName: 'bookName1'}},
          {id: 'contactId2', addressbook: {bookId: 'bookId2', bookName: 'bookName2'}}
        ],
        B: [{id: 'contactId3', addressbook: {bookId: 'bookId2', bookName: 'bookName2'}}]
      };

      var getMock = sinon.stub().returns(categories);
      var removeItemWithIdMock = sinon.spy();

      var AlphaCategoryService = function() {
        return {
          get: getMock,
          removeItemWithId: removeItemWithIdMock
        };
      };

      initController(AlphaCategoryService);

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, { bookName: 'bookName2', bookId: 'bookId2' });
      expect(getMock).to.have.been.calledOnce;
      expect(removeItemWithIdMock).to.have.been.calledTwice;
      expect(removeItemWithIdMock.firstCall.calledWith('contactId2')).to.be.true;
      expect(removeItemWithIdMock.secondCall.calledWith('contactId3')).to.be.true;
    });
  });
});
