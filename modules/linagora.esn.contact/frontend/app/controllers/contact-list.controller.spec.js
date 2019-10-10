'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactListController controller', function() {
  var $rootScope, $controller, $timeout, $state, $stateParams, $alert;
  var AddressBookPaginationService, AddressBookPaginationRegistryMock, contactAddressbookService, contactAddressbookDisplayService,
    contactUpdateDataService, gracePeriodService;
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

  function createPaginationMocks(singleFn) {

    function SingleMock(options) {
      this.options = options;
    }
    SingleMock.prototype.loadNextItems = singleFn;

    function AggregateMock(options) {
      this.options = options;
    }
    AggregateMock.prototype.loadNextItems = singleFn;

    var mocks = {
      single: SingleMock,
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

    it('should call contactAddressbookService.getAddressbookByBookName to get specific address books if bookId and bookName is provided', function() {
      $stateParams.bookId = 'bookId';
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
    $stateParams.bookId = 'bookId';
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

    $controller('ContactListController', {
      $scope: scope,
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

  it('should add the contact to the contact list of addressbook on CONTACT_EVENTS.CREATED event', function() {
    var bookId = 'foo';
    var bookName = 'foobar';
    var currentAddressbooks = [{ bookId: bookId, bookName: bookName }];
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

    $stateParams.bookId = bookId;
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

    $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
    $rootScope.$digest();

    expect(addItemsMock).to.not.have.been.calledWith([contact]);
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
      expect(openContactFormMock).to.have.been.calledWith({
        bookId: scope.bookId,
        bookName: DEFAULT_ADDRESSBOOK_NAME
      });
    });

    it('should open the contact creation form for specific address book if user is viewing that address book', function() {
      var bookId = 'foo';
      var bookName = 'foobar';

      $stateParams.bookId = bookId;
      $stateParams.bookName = bookName;
      addressbooks = [{ bookId: bookId, bookName: bookName }];
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(addressbooks));

      initController();

      scope.openContactCreation();
      expect(openContactFormMock).to.have.been.calledWith({
        bookId: scope.bookId,
        bookName: bookName
      });
    });
  });

  describe('When Deleted Addressbook event is fired', function() {
    it('should change to aggregated contacts view if the current viewing addressbook is deleted', function() {
      var bookId = 'bookId';
      var bookName = 'twitter';
      var currentAddressbooks = [{
        bookId: bookId,
        bookName: bookName
      }];

      $state.go = sinon.spy();

      $stateParams.bookId = bookId;
      $stateParams.bookName = bookName;
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, { bookId: bookId, bookName: bookName });
      expect($state.go).to.have.been.calledWith('contact.addressbooks', { bookId: 'all', bookName: null });
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
      var bookId = 'bookId';
      var bookName = 'bookName';
      var currentAddressbooks = [{
        bookId: bookId,
        bookName: bookName
      }];

      $stateParams.bookId = bookId;
      $stateParams.bookName = bookName;
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, {
        name: 'Twitter Contacts',
        bookId: bookId,
        bookName: bookName
      });
      expect(scope.bookTitle).to.equal('Twitter Contacts');
    });

    it('should not update addressbook title in subheader if the current viewing addressbook is not the one is updated', function() {
      var bookId = 'bookId';
      var bookName = 'bookName';
      var currentAddressbooks = [{
        bookId: bookId,
        bookName: bookName,
        name: 'Twitter Contacts'
      }];

      $stateParams.bookId = bookId;
      $stateParams.bookName = bookName;
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, {
        name: 'Google Contacts',
        bookId: bookId,
        bookName: 'goole'
      });
      expect(scope.bookTitle).to.equal('Twitter Contacts');
    });
  });

  describe('When deleted addressbook subscription event is fired', function() {
    it('should change to aggregated contacts view if the current viewing addressbook is deleted', function() {
      var bookId = 'bookId';
      var bookName = 'twitter';
      var currentAddressbooks = [{
        bookId: bookId,
        bookName: bookName
      }];

      $state.go = sinon.spy();

      $stateParams.bookId = bookId;
      $stateParams.bookName = bookName;
      contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(currentAddressbooks));

      initController();

      $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, {
        bookId: bookId,
        bookName: bookName
      });
      expect($state.go).to.have.been.calledWith('contact.addressbooks', { bookId: 'all', bookName: null });
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
