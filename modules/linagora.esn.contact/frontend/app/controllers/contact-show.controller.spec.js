'use strict';

/* global sinon, chai: false */

var expect = chai.expect;

describe('The ContactShowController', function() {
  var $window, $controller, $state, $rootScope, $alert, $timeout, $stateParams, $location;
  var scope, contactUpdateDataService, ContactShellDisplayBuilder, gracePeriodService, ContactAPIClient, contactAddressbookDisplayService;
  var ContactShell, notificationFactory, selectionService, VcardBuilder, ContactLocationHelper;
  var CONTACT_AVATAR_SIZE, CONTACT_EVENTS;
  var bookId = '123456789', bookName = 'bookName', cardId = '987654321';

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');

    ContactShellDisplayBuilder = {
      build: function(shell) {return shell;}
    };

    ContactShell = function() {};
    notificationFactory = {
      weakError: sinon.spy(),
      weakInfo: sinon.spy(),
      strongError: sinon.spy()
    };
    $location = {
      path: function() {},
      url: function() {},
      search: function() {
        return {
          q: {
            replace: function() {}
          }
        };
      }
    };
    $stateParams = {
      bookId: bookId,
      bookName: bookName
    };
    selectionService = {
      clear: function() {}
    };
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

    ContactAPIClient = {
      addressbookHome: function() {
        return {
          addressbook: function() {
            return {
              list: function() { return $q.when([]); },
              get: function() { return $q.when({ name: 'My Contacts' }); },
              vcard: function() {
                return {
                  get: function() { return $q.when(); },
                  list: function() { return $q.when({}); },
                  search: function() { return $q.when({ data: [] }); },
                  create: function() { return $q.when(); },
                  update: function() { return $q.when(); },
                  remove: function() { return $q.when(); }
                };
              }
            };
          }
        };
      }
    };

    VcardBuilder = {
      toVcard: function() {
        return 'vcard';
      }
    };

    ContactLocationHelper = {
      home: function() {},
      contact: {
        new: function() {},
        show: function() {},
        edit: function() {}
      }
    };

    module(function($provide) {
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('$location', $location);
      $provide.value('selectionService', selectionService);
      $provide.value('$stateParams', $stateParams);
      $provide.value('$alert', function(options) { $alert.alert(options); });
      $provide.value('gracePeriodService', gracePeriodService);
      $provide.value('contactUpdateDataService', contactUpdateDataService);
      $provide.decorator('$window', function($delegate) {
        $delegate.addEventListener = angular.noop;

        return $delegate;
      });
      $provide.value('ContactShell', ContactShell);
      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('VcardBuilder', VcardBuilder);
      $provide.value('ContactLocationHelper', ContactLocationHelper);
      $provide.value('ContactShellDisplayBuilder', ContactShellDisplayBuilder);
    });
  });

  beforeEach(function() {
    inject(function(
      _$window_,
      _$controller_,
      _$rootScope_,
      _$timeout_,
      _$state_,
      _contactAddressbookDisplayService_,
      _CONTACT_AVATAR_SIZE_,
      _CONTACT_EVENTS_
    ) {
      $window = _$window_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $state = _$state_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
      CONTACT_AVATAR_SIZE = _CONTACT_AVATAR_SIZE_;
      CONTACT_EVENTS = _CONTACT_EVENTS_;
    });

    scope = $rootScope.$new();
    contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;

    createVcardMock(function() {
      return {
        get: function() { return $q.when({}); }
      };
    });
  });

  function createVcardMock(vcardFn, bookId, bookName) {
    ContactAPIClient.addressbookHome = function(id) {
      if (bookId) {
        expect(id).to.equal(bookId);
      }

      return {
        addressbook: function(name) {
          if (bookName) {
            expect(name).to.equal(bookName);
          }

          return {
            vcard: vcardFn,
            get: function() { return $q.when({ bookId: bookId, bookName: bookName, name: 'My Contacts' }); }
          };
        }
      };
    };
  }

  function initController() {
    $controller('ContactShowController', { $scope: scope });
    scope.$digest();
  }

  it('should change the state to the new contact destination after contact is moved', function(done) {
    $state.go = sinon.spy();

    initController();

    var contact = {
      id: scope.cardId,
      addressbook: {
        bookName: 'new-addressbook'
      }
    };

    $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);

    expect($state.go).to.have.been.calledWith('contact.addressbooks.show', {
      bookId: scope.bookId,
      bookName: 'new-addressbook',
      cardId: scope.cardId
    }, { location: 'replace' });

    done();
  });

  it('should go to the contact list state when the contact is deleted', function(done) {
    $state.go = sinon.spy();

    initController();

    var contact = {
      id: scope.cardId,
      addressbook: {
        bookName: 'new-addressbook'
      }
    };

    $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);

    expect($state.go).to.have.been.calledWith('contact.addressbooks', {
      bookId: scope.bookId,
      bookName: 'new-addressbook'
    }, { location: 'replace' });

    done();
  });

  it('should have bigger size for contact avatar', function() {
    initController();
    expect(scope.avatarSize).to.equal(CONTACT_AVATAR_SIZE.bigger);
  });

  it('should display an error if the contact cannot be loaded initially', function(done) {
    createVcardMock(function() {
      return {
        get: function() { return $q.reject('WTF'); }
      };
    });
    $alert.alert = function() { done(); };

    initController();
  });

  describe('The fillContactData function', function() {
    it('should fill the scope with the contact', function() {
      contactUpdateDataService.contact = {};
      initController();
      var contact = { emails: [{ type: 'work', value: 'me@work.com' }, {type: 'home', value: 'me@home.com' }] };

      scope.fillContactData(contact);
      contactUpdateDataService.contact = contact;
      expect(scope.contact).to.deep.equal(contact);
    });

    it('should fill the scope with the contact emails', function() {
      contactUpdateDataService.contact = {};
      initController();
      var contact = { emails: [{ type: 'work', value: 'me@work.com' }, {type: 'home', value: 'me@home.com' }] };

      scope.fillContactData(contact);
      expect(scope.emails.length).to.equal(2);
    });

    it('should fill the scope with the contact phones', function() {
      contactUpdateDataService.contact = {};
      initController();
      var contact = { tel: [{ type: 'work', value: '+33333333' }, { type: 'home', value: '+33444444' }] };

      scope.fillContactData(contact);
      expect(scope.phones.length).to.equal(2);
    });

    it('should fill the scope with the contact formattedBirthday', function() {
      contactUpdateDataService.contact = {};
      initController();
      var contact = { birthday: '123', tel: [{ type: 'work', value: '+33333333' }, { type: 'home', value: '+33444444' }] };

      scope.fillContactData(contact);
      expect(scope.formattedBirthday).to.be.defined;
    });

    it('should build the display shell', function() {
      var display = {foo: 'bar'};

      ContactShellDisplayBuilder.build = function() {
        return display;
      };
      contactUpdateDataService.contact = {};
      initController();
      var contact = { birthday: '123', tel: [{ type: 'work', value: '+33333333' }, { type: 'home', value: '+33444444' }] };

      scope.fillContactData(contact);
      expect(scope.displayShell).to.deep.equal(display);
    });

  });

  describe('The $scope.getAddress function', function() {
    it('should filter only passed in address type', function() {
      contactUpdateDataService.contact = {
        addresses: [
          {
            city: '',
            country: 'France',
            street: '',
            type: 'work',
            zip: ''
          },
          {
            city: '',
            country: 'Vietnam',
            street: '',
            type: 'home',
            zip: ''
          }
        ]
      };

      initController();

      var address = {
        city: '',
        country: 'France',
        street: '',
        type: 'work',
        zip: ''
      };

      expect(scope.getAddress('work')).to.deep.equal(address);
    });

    it('should filter out undefined address type', function() {
      contactUpdateDataService.contact = {
        addresses: [
          {
            city: '',
            country: 'France',
            street: '',
            type: 'work',
            zip: ''
          },
          {
            city: '',
            country: 'Vietnam',
            street: '',
            zip: ''
          }
        ]
      };

      initController();

      var address = {
        city: '',
        country: 'France',
        street: '',
        type: 'work',
        zip: ''
      };

      expect(scope.getAddress('work')).to.deep.equal(address);
    });
  });

  describe('The $scope.shouldDisplayWork function', function() {

    it('should return false when nothing defined', function() {
      contactUpdateDataService.contact = {};
      initController();
      expect(scope.shouldDisplayWork()).to.be.false;
    });

    it('should return true when orgName is defined', function() {
      contactUpdateDataService.contact = { orgName: 'linagora' };
      initController();
      expect(scope.shouldDisplayWork()).to.be.true;
    });

    it('should return true when orgRole is defined', function() {
      contactUpdateDataService.contact = { orgRole: 'CTO' };
      initController();
      expect(scope.shouldDisplayWork()).to.be.true;
    });

    it('should return true when work address is filled', function() {
      contactUpdateDataService.contact = { addresses: [{ type: 'work', value: 'Paris' }] };
      initController();
      expect(scope.shouldDisplayWork()).to.be.true;
    });
  });

  describe('The $scope.shouldDisplayHome function', function() {

    it('should return false when nothing defined', function() {
      contactUpdateDataService.contact = {};
      initController();
      expect(scope.shouldDisplayHome()).to.be.false;
    });

    it('should return true when home address is filled', function() {
      contactUpdateDataService.contact = { addresses: [{ type: 'home', value: 'Montpellier' }] };
      initController();
      expect(scope.shouldDisplayHome()).to.be.true;
    });

    it('should return true when birthday is filled', function() {
      contactUpdateDataService.contact = { birthday: '15/12/1978' };
      initController();
      expect(scope.shouldDisplayHome()).to.be.true;
    });

    it('should return true when nickname is filled', function() {
      contactUpdateDataService.contact = { nickname: 'yolo' };
      initController();
      expect(scope.shouldDisplayHome()).to.be.true;
    });
  });

  describe('The $scope.shouldDisplayOthers function', function() {

    it('should return false when nothing defined', function() {
      contactUpdateDataService.contact = {};
      initController();
      expect(scope.shouldDisplayOthers()).to.be.false;
    });

    it('should return true when other address is defined', function() {
      contactUpdateDataService.contact = { addresses: [{ type: 'other', value: 'Toulouse' }] };
      initController();
      expect(scope.shouldDisplayOthers()).to.be.true;
    });

    it('should return false when other tags are defined but empty', function() {
      contactUpdateDataService.contact = { tags: [] };
      initController();
      expect(scope.shouldDisplayOthers()).to.be.false;
    });

    it('should return true when other tags are defined and not empty', function() {
      contactUpdateDataService.contact = { tags: ['js', 'node'] };
      initController();
      expect(scope.shouldDisplayOthers()).to.be.true;
    });

    it('should return true when notes are defined', function() {
      contactUpdateDataService.contact = { notes: 'This guy is so funky' };
      initController();
      expect(scope.shouldDisplayOthers()).to.be.true;
    });

    it('should return false when other urls are defined but empty', function() {
      contactUpdateDataService.contact = { urls: [] };
      initController();
      expect(scope.shouldDisplayOthers()).to.be.false;
    });

    it('should return true when other tags are defined and not empty', function() {
      contactUpdateDataService.contact = { urls: ['foo', 'bar'] };
      initController();
      expect(scope.shouldDisplayOthers()).to.be.true;
    });
  });

  describe('Tests show contact during graceperiod task', function() {

    it('should show the contact taken from contactUpdateDataService', function() {
      contactUpdateDataService.contact = { id: 'myId' };
      initController();
      expect(scope.contact).to.eql(contactUpdateDataService.contact);
    });

    it('should clear contactUpdateDataService.contact when switch to other path', function() {
      contactUpdateDataService.contact = { id: 'myId' };
      initController();

      scope.$emit('$stateChangeStart', {
        name: '/some/path/other/than/contact/edit'
      });

      scope.$digest();
      expect(contactUpdateDataService.contact).to.be.null;
    });

    it('should update contactUpdateDataService.contact when ther user edits contact again', function() {
      contactUpdateDataService.contact = { id: 'myId' };
      initController();

      scope.contact = { id: 'myOtherId' };
      scope.bookId = bookId;
      scope.bookName = bookName;
      scope.cardId = cardId;

      scope.$emit('$stateChangeStart', {
        name: 'contact.addressbooks.edit'
      },
      {
        bookId: bookId,
        bookName: bookName,
        cardId: cardId
      });

      scope.$digest();
      expect(contactUpdateDataService.contact).to.eql(scope.contact);
    });

    it('should flush the task when switch to other path', function(done) {
      contactUpdateDataService.contact = { id: 'myId' };
      contactUpdateDataService.taskId = 'a taskId';

      gracePeriodService.flush = function(taskId) {
        expect(taskId).to.equal('a taskId');
        done();
      };

      initController();

      scope.$emit('$stateChangeStart', {
        name: '/some/path/other/than/contact/edit'
      });

      scope.$digest();
    });

    it('should update contact on CONTACT_EVENTS.CANCEL_UPDATE event', function() {
      contactUpdateDataService.contact = { id: 'myId', firstName: 'Bob' };
      contactUpdateDataService.taskId = 'a taskId';

      initController();
      scope.cardId = 'myId';
      var newContact = { id: 'myId', firstName: 'Alice' };

      scope.$emit(CONTACT_EVENTS.CANCEL_UPDATE, newContact);

      scope.$digest();

      expect(scope.contact).to.eql(newContact);
    });

    it('should flush the task on beforeunload event', function(done) {
      contactUpdateDataService.contact = { id: 'myId' };
      contactUpdateDataService.taskId = 'a taskId';

      gracePeriodService.flush = sinon.spy();
      $window.addEventListener = function(evt, handler) {
        expect(evt).to.equal('beforeunload');
        handler();
        expect(gracePeriodService.flush.calledWithExactly('a taskId')).to.be.true;
        done();
      };

      initController();

    });

  });

  describe('The deleteContact function', function() {

    it('should call deleteContact service with the right bookId, bookName and cardId', function() {
      scope.bookName = 'bookName';
      scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar', addressbook: {} };
      var spy = sinon.spy();

      $controller.bind(null, 'ContactShowController', {
        $scope: scope,
        deleteContact: spy
      })();
      scope.deleteContact();
      $timeout.flush();
      expect(spy).to.have.been.calledWith(bookId, scope.bookName, scope.contact);
    });
  });
});
