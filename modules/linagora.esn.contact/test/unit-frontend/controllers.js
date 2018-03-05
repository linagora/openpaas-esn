'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts controller module', function() {

  var $rootScope, $controller, $timeout, scope, ContactShell, AddressBookPaginationService, AddressBookPaginationRegistryMock,
    notificationFactory, usSpinnerService, $location, $state, $stateParams, selectionService, $alert, gracePeriodService, sharedContactDataService,
    sortedContacts, ContactLiveUpdate, contactUpdateDataService, $window, CONTACT_EVENTS, CONTACT_LIST_DISPLAY_MODES,
    ContactAPIClient, VcardBuilder, ContactLocationHelper, closeContactForm, closeContactFormMock, openContactForm, openContactFormMock, addressbooks,
    ContactShellDisplayBuilder, esnI18nServiceMock;

  var bookId = '123456789', bookName = 'bookName', cardId = '987654321';
  addressbooks = [];

  beforeEach(function() {
    usSpinnerService = {
      spin: function() {},
      stop: function() {}
    };

    ContactShellDisplayBuilder = {
      build: function(shell) {return shell;}
    };

    ContactShell = function() {};
    ContactLiveUpdate = {
      startListen: function() {},
      stopListen: function() {}
    };
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

    esnI18nServiceMock = {
      translate: function(input) {
        return {
          toString: function() { return input; },
          text: input
        };
      }
    };

    openContactFormMock = function() {};
    openContactForm = function(id, name) {
      return openContactFormMock(id, name);
    };

    closeContactFormMock = function() {};
    closeContactForm = function() {
      return closeContactFormMock.apply();
    };

    angular.mock.module('esn.core');

    module('linagora.esn.contact', function($provide) {
      $provide.value('ContactLiveUpdate', ContactLiveUpdate);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('$location', $location);
      $provide.value('selectionService', selectionService);
      $provide.value('$stateParams', $stateParams);
      $provide.value('$alert', function(options) { $alert.alert(options); });
      $provide.value('gracePeriodService', gracePeriodService);
      $provide.value('contactUpdateDataService', contactUpdateDataService);
      $provide.value('usSpinnerService', usSpinnerService);
      $provide.decorator('$window', function($delegate) {
        $delegate.addEventListener = angular.noop;

        return $delegate;
      });
      $provide.value('ContactShell', ContactShell);
      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('AddressBookPaginationService', AddressBookPaginationService);
      $provide.value('AddressBookPaginationRegistry', AddressBookPaginationRegistryMock);
      $provide.value('VcardBuilder', VcardBuilder);
      $provide.value('ContactLocationHelper', ContactLocationHelper);
      $provide.value('openContactForm', openContactForm);
      $provide.value('closeContactForm', closeContactForm);
      $provide.value('addressbooks', addressbooks);
      $provide.value('ContactShellDisplayBuilder', ContactShellDisplayBuilder);
      $provide.value('esnI18nService', esnI18nServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$window_, _$rootScope_, _$controller_, _$timeout_, _$state_, _sharedContactDataService_, ALPHA_ITEMS, _CONTACT_EVENTS_, _CONTACT_LIST_DISPLAY_MODES_) {
    $window = _$window_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    $state = _$state_;
    sharedContactDataService = _sharedContactDataService_;
    sortedContacts = ALPHA_ITEMS.split('').reduce(function(a, b) {
      a[b] = [];

      return a;
    }, {});

    scope = $rootScope.$new();
    scope.contact = {};
    CONTACT_EVENTS = _CONTACT_EVENTS_;
    CONTACT_LIST_DISPLAY_MODES = _CONTACT_LIST_DISPLAY_MODES_;
  }));

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
          return { vcard: vcardFn };
        }
      };
    };
  }

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

  describe('the newContactController', function() {

    beforeEach(function() {
      $controller('newContactController', {
        $scope: scope
      });
    });

    it('should initialize $scope.contact to an already existing one when defined', function() {
      var scope = {
        $on: function() {}
      },
      contact = {lastName: 'Last'};

      $controller('newContactController', {
        $scope: scope,
        sharedContactDataService: {
          contact: contact
        }
      });

      expect(scope.contact).to.deep.equal(contact);
    });

    it('should clear sharedContactDataService.contact after initialization', function() {
      var scope = {
        $on: function() {}
      },
      contact = {lastName: 'Last'},
      sharedContactDataService = {
        contact: contact
      };

      $controller('newContactController', {
        $scope: scope,
        sharedContactDataService: sharedContactDataService
      });

      expect(sharedContactDataService.contact).to.deep.equal({});
    });

    it('should get the bookName of address book in stateParam', function() {
      $controller('newContactController', {
        $scope: scope,
        $stateParams: $stateParams,
        sharedContactDataService: {
          contact: {}
        }
      });

      expect(scope.bookName).to.equal(bookName);
    });

    describe('the accept function', function() {

      it('should not call ContactAPIClient when already calling it', function(done) {
        scope.calling = true;
        ContactAPIClient.addressbookHome = function() {
          return done(new Error('This test should not call ContactAPIClient'));
        };
        scope.accept();
        done();
      });

      it('should not call ContactAPIClient when contact is not valid', function(done) {
        ContactAPIClient.addressbookHome = function() {
          return done(new Error('This test should not call ContactAPIClient'));
        };
        scope.accept();
        done();
      });

      it('should display an error when contact is not valid', function(done) {
        ContactAPIClient.addressbookHome = function() {
          return done(new Error('This test should not call ContactAPIClient'));
        };
        $alert.alert = function() { done(); };

        scope.accept();
        scope.$digest();
      });

      it('should not grace the request when contact is not valid', function(done) {
        gracePeriodService.grace = done;

        scope.accept();
        scope.$digest();

        done();
      });

      it('should call ContactAPIClient with right bookId, bookName and contact', function(done) {
        scope.bookId = bookId;
        scope.bookName = bookName;
        scope.contact = { firstName: 'Foo', lastName: 'Bar' };
        createVcardMock(function() {
          return {
            create: function(contact) {
              expect(contact).to.deep.equal(scope.contact);
              done();
            }
          };
        }, bookId, bookName);
        scope.accept();
      });

      it('should change page on contact create success', function(done) {
        scope.contact = {id: 1, firstName: 'Foo', lastName: 'Bar'};
        $state.go = function(to, params, options) {
          expect(to).to.equal('/contact/show/:bookId/:bookName/:cardId');
          expect(params.bookId).to.equal(bookId);
          expect(params.bookName).to.equal(scope.bookName);
          expect(params.cardId).to.equal(scope.contact.id);
          expect(options.location).to.equal('replace');
          done();
        };

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            }
          };
        });

        scope.accept();
        scope.$digest();
      });

      it('should not change page if the contact is invalid', function(done) {
        $location.path = function() {
          done('This test should not change the location');
        };

        scope.accept();
        scope.$digest();

        done();
      });

      it('should notify user on contact create failure', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        $location.path = function() {
          done(new Error('This test should not change the location'));
        };

        notificationFactory.weakError = function() {
          done();
        };

        createVcardMock(function() {
          return {
            create: function() {
              return $q.reject();
            }
          };
        });

        scope.accept();
        scope.$digest();
      });

      it('should set back the calling flag to false when complete', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};
        $location.path = function() {};

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            }
          };
        });

        scope.accept().then(function() {
          expect(scope.calling).to.be.false;

          done();
        });
        scope.$digest();
      });

      it('should grace the request using the default delay on success', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.askUserForCancel = function(taskId, text, linkText, delay) {
          expect(delay).to.not.exist;
          done();
        };

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            }
          };
        });

        scope.accept();
        scope.$digest();
      });

      it('should display correct title and link during the grace period', function() {
        scope.contact = {firstName: 'Foo', lastName: 'Bar', id: 'myTaskId'};

        gracePeriodService.askUserForCancel = sinon.spy(function(message, linkText) {
          expect(message.text).to.equal('You have just created a new contact (%s).');
          expect(linkText).to.equal('Cancel it');

          return {promise: $q.when({})};
        });

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            }
          };
        });

        scope.accept();
        scope.$digest();
      });

      it('should not grace the request on contact create failure', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.clientGrace = done;

        createVcardMock(function() {
          return {
            create: function() {
              return $q.reject();
            }
          };
        });

        scope.accept();
        scope.$digest();

        done();
      });

      it('should delete the contact if the user cancels during the grace period', function() {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.askUserForCancel = function() {
          var promise = $q.when({
            cancelled: true,
            success: angular.noop,
            error: angular.noop
          });

          return {promise: promise};
        };

        var removeSpy = sinon.spy($q.when.bind());

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            },
            remove: removeSpy
          };
        });

        scope.accept();
        scope.$digest();
        expect(removeSpy).to.have.been.calledWith();
      });

      it('should notice the user that the contact creation can\'t be cancelled', function() {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        var errorSpy = sinon.spy();

        gracePeriodService.askUserForCancel = function() {
          var promise = $q.when({
            cancelled: true,
            success: angular.noop,
            error: errorSpy
          });

          return {promise: promise};
        };

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            },
            remove: function() {
              return $q.reject();
            }
          };
        });

        scope.accept();
        scope.$digest();
        expect(errorSpy).to.have.been.called;
      });

      it('should go back to the editing form if the user cancels during the grace period, saving the contact', function() {
        scope.contact = {firstName: 'Foo', lastName: 'Bar', title: 'PDG'};

        openContactFormMock = sinon.spy();

        gracePeriodService.askUserForCancel = function() {
          var promise = $q.when({
            cancelled: true,
            success: angular.noop,
            error: angular.noop
          });

          return {promise: promise};
        };

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when();
            },
            remove: function() {
              return $q.when();
            }
          };
        });

        scope.accept();
        scope.$digest();
        expect(openContactFormMock).to.have.been.calledOnce;
      });

    });
  });

  describe('The showContactController', function() {
    var CONTACT_AVATAR_SIZE;

    beforeEach(function() {
      this.initController = $controller.bind(null, 'showContactController', { $scope: scope});
      angular.mock.inject(function(_CONTACT_AVATAR_SIZE_) {
        CONTACT_AVATAR_SIZE = _CONTACT_AVATAR_SIZE_;
      });
    });

    it('should have bigger size for contact avatar', function() {
      this.initController();
      expect(scope.avatarSize).to.equal(CONTACT_AVATAR_SIZE.bigger);
    });

    it('should display an error if the contact cannot be loaded initially', function(done) {
      createVcardMock(function() {
        return {
          get: function() { return $q.reject('WTF'); }
        };
      });
      $alert.alert = function() { done(); };

      this.initController();
      scope.$digest();
    });

    describe('The fillContactData function', function() {
      it('should fill the scope with the contact', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};
        scope.fillContactData(contact);
        contactUpdateDataService.contact = contact;
        expect(scope.contact).to.deep.equal(contact);
      });

      it('should fill the scope with the contact emails', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};
        scope.fillContactData(contact);
        expect(scope.emails.length).to.equal(2);
      });

      it('should fill the scope with the contact phones', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        var contact = {tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        scope.fillContactData(contact);
        expect(scope.phones.length).to.equal(2);
      });

      it('should fill the scope with the contact formattedBirthday', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        var contact = {birthday: '123', tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        scope.fillContactData(contact);
        expect(scope.formattedBirthday).to.be.defined;
      });

      it('should build the display shell', function() {
        var display = {foo: 'bar'};
        ContactShellDisplayBuilder.build = function() {
          return display;
        };
        contactUpdateDataService.contact = {};
        this.initController();
        var contact = {birthday: '123', tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        scope.fillContactData(contact);
        expect(scope.displayShell).to.deep.equal(display);
      });

    });

    describe('The $scope.shouldDisplayWork function', function() {

      it('should return false when nothing defined', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        expect(scope.shouldDisplayWork()).to.be.false;
      });

      it('should return true when orgName is defined', function() {
        contactUpdateDataService.contact = {orgName: 'linagora'};
        this.initController();
        expect(scope.shouldDisplayWork()).to.be.true;
      });

      it('should return true when orgRole is defined', function() {
        contactUpdateDataService.contact = {orgRole: 'CTO'};
        this.initController();
        expect(scope.shouldDisplayWork()).to.be.true;
      });

      it('should return true when work address is filled', function() {
        contactUpdateDataService.contact = {addresses: [{type: 'work', value: 'Paris'}]};
        this.initController();
        expect(scope.shouldDisplayWork()).to.be.true;
      });
    });

    describe('The $scope.shouldDisplayHome function', function() {

      it('should return false when nothing defined', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        expect(scope.shouldDisplayHome()).to.be.false;
      });

      it('should return true when home address is filled', function() {
        contactUpdateDataService.contact = {addresses: [{type: 'home', value: 'Montpellier'}]};
        this.initController();
        expect(scope.shouldDisplayHome()).to.be.true;
      });

      it('should return true when birthday is filled', function() {
        contactUpdateDataService.contact = {birthday: '15/12/1978'};
        this.initController();
        expect(scope.shouldDisplayHome()).to.be.true;
      });

      it('should return true when nickname is filled', function() {
        contactUpdateDataService.contact = {nickname: 'yolo'};
        this.initController();
        expect(scope.shouldDisplayHome()).to.be.true;
      });
    });

    describe('The $scope.shouldDisplayOthers function', function() {

      it('should return false when nothing defined', function() {
        contactUpdateDataService.contact = {};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.false;
      });

      it('should return true when other address is defined', function() {
        contactUpdateDataService.contact = {addresses: [{type: 'other', value: 'Toulouse'}]};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.true;
      });

      it('should return false when other tags are defined but empty', function() {
        contactUpdateDataService.contact = {tags: []};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.false;
      });

      it('should return true when other tags are defined and not empty', function() {
        contactUpdateDataService.contact = {tags: ['js', 'node']};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.true;
      });

      it('should return true when notes are defined', function() {
        contactUpdateDataService.contact = {notes: 'This guy is so funky'};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.true;
      });

      it('should return false when other urls are defined but empty', function() {
        contactUpdateDataService.contact = {urls: []};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.false;
      });

      it('should return true when other tags are defined and not empty', function() {
        contactUpdateDataService.contact = {urls: ['foo', 'bar']};
        this.initController();
        expect(scope.shouldDisplayOthers()).to.be.true;
      });
    });

    describe('Tests show contact during graceperiod task', function() {

      it('should show the contact taken from contactUpdateDataService', function() {
        contactUpdateDataService.contact = { id: 'myId' };
        this.initController();
        expect(scope.contact).to.eql(contactUpdateDataService.contact);
      });

      it('should clear contactUpdateDataService.contact when switch to other path', function() {
        contactUpdateDataService.contact = { id: 'myId' };
        this.initController();

        scope.$emit('$stateChangeStart', {
          name: '/some/path/other/than/contact/edit'
        });

        scope.$digest();
        expect(contactUpdateDataService.contact).to.be.null;
      });

      it('should update contactUpdateDataService.contact when ther user edits contact again', function() {
        contactUpdateDataService.contact = { id: 'myId' };
        this.initController();

        scope.contact = { id: 'myOtherId' };
        scope.bookId = bookId;
        scope.bookName = bookName;
        scope.cardId = cardId;

        scope.$emit('$stateChangeStart', {
          name: '/contact/edit/:bookId/:bookName/:cardId'
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

        this.initController();

        scope.$emit('$stateChangeStart', {
          name: '/some/path/other/than/contact/edit'
        });

        scope.$digest();
      });

      it('should update contact on CONTACT_EVENTS.CANCEL_UPDATE event', function() {
        contactUpdateDataService.contact = { id: 'myId', firstName: 'Bob' };
        contactUpdateDataService.taskId = 'a taskId';

        this.initController();
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

        this.initController();

      });

    });

    describe('The deleteContact function', function() {

      it('should call deleteContact service with the right bookId, bookName and cardId', function() {
        scope.bookName = 'bookName';
        scope.contact = {id: 1, firstName: 'Foo', lastName: 'Bar', addressbook: {}};
        var spy = sinon.spy();

        $controller.bind(null, 'showContactController', {
          $scope: scope,
          deleteContact: spy
        })();
        scope.deleteContact();
        $timeout.flush();
        expect(spy).to.have.been.calledWith(bookId, scope.bookName, scope.contact);
      });
    });
  });

  describe('the contactAvatarModalController', function() {

    beforeEach(function() {
      $controller('contactAvatarModalController', {$scope: scope});
    });

    describe('the saveContactAvatar method', function() {
      it('should do nothing if no image is selected', function() {
        selectionService.getImage = function() {
          return false;
        };
        scope.saveContactAvatar();
        expect(scope.contact.photo).to.not.exist;
      });

      it('should add the image as base64 string to the contact and close the modal', function() {
        var blob = 'theblob';
        var imageAsBase64 = 'image';
        var modalHidden = false;

        scope.modify = function() {
          return $q.when(scope.contact);
        };

        window.FileReader = function() {
          return {
            readAsDataURL: function(data) {
              expect(data).to.equal(blob);
              this.result = imageAsBase64;
              this.onloadend();
            }
          };
        };

        selectionService.getImage = function() {
          return true;
        };
        selectionService.getBlob = function(mimetype, callback) {
          return callback(blob);
        };

        scope.modal = {
          hide: function() {
            modalHidden = true;
          }
        };

        scope.saveContactAvatar();
        expect(scope.loading).to.be.false;
        expect(modalHidden).to.be.true;
        expect(scope.contact.photo).to.equal(imageAsBase64);
      });
    });

  });

  describe('The editContactController controller', function() {
    var contactFromDAV;
    beforeEach(function() {
      contactFromDAV = {
        addressbook: { editable: true },
        id: 1,
        firstName: 'Foo',
        lastName: 'Bar',
        vcard: 'vcard'
      };
      createVcardMock(function() {
        return {
          update: function() {
            return $q.when();
          },
          get: function() {
            return $q.when(contactFromDAV);
          }};
      });
      this.initController = $controller.bind(null, 'editContactController', { $scope: scope });
    });

    it('should update the $scope.contact etag when the contact has been modified from a CONTACT_EVENTS.UPDATED event', function() {
      contactUpdateDataService.contact = {id: 1, etag: 2};
      var event = {id: 1, etag: 3};
      this.initController();
      $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, event);
      $rootScope.$digest();
      expect(scope.contact.etag).to.equal(event.etag);
    });

    it('should not update the $scope.contact etag when CONTACT_EVENTS.UPDATED event data is not the same contact', function() {
      var etag = 2;
      contactUpdateDataService.contact = {id: 1, etag: etag};
      var event = {id: 2, etag: 3};
      this.initController();
      $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, event);
      $rootScope.$digest();
      expect(scope.contact.etag).to.equal(etag);
    });

    it('should not update the $scope.contact etag when CONTACT_EVENTS.UPDATED event data does not contains etag', function() {
      var etag = 2;
      contactUpdateDataService.contact = {id: 1, etag: etag};
      var event = {id: 1};
      this.initController();
      $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, event);
      $rootScope.$digest();
      expect(scope.contact.etag).to.equal(etag);
    });

    it('should take contact from contactUpdateDataService if there was a graceperiod', function() {
      contactUpdateDataService.contact = { id: 'myId' };
      var getFnSpy = sinon.spy();
      createVcardMock(function() {
        return { get: getFnSpy };
      });
      this.initController();
      expect(scope.contact).to.eql({ id: 'myId', vcard: 'vcard' });
      expect(contactUpdateDataService.contact).to.be.null;
      expect(getFnSpy.callCount).to.equal(0);
    });

    it('should redirect to detail page if addressbook is not editable', function(done) {
      contactUpdateDataService.contact = null;
      scope.bookId = 'bookId';
      scope.bookName = 'bookName';
      scope.cardId = 'cardId';
      scope.close = done();
      createVcardMock(function() {
        return {
          get: function() {
            return {
              then: function(resolve) {
                return resolve({addressbook: {editable: false} });
              }
            };
          }
        };
      });
      this.initController();
    });

    it('should redirect to address book contact list page if it can not get contact detail', function(done) {
      scope.bookName = 'contacts';

      $state.go = function(to, params) {
        expect(to).to.equal('contact.addressbooks');
        expect(params.bookName).to.equal(scope.bookName);
        done();
      };
      createVcardMock(function() {
        return { get: function() {
          return $q.reject();
        }};
      });
      this.initController();
      $rootScope.$digest();
      $timeout.flush();
    });

    it('should not redirect to detail page if addressbook is editable', function(done) {
      scope.close = function() {
        done(new Error());
      };
      this.initController();
      done();
    });

    describe('The save function', function() {
      it('should call ContactAPIClient with the right bookId and cardId', function(done) {
        var originalContact = { id: 123, firstName: 'Foo', lastName: 'Bar' };

        createVcardMock(function(cardId) {
          expect(cardId).to.equal(scope.contact.id);

          return {
            update: function(contact) {
              expect(contact).to.deep.equal(scope.contact);
              done();
            },
            get: function() {
              return $q.when(contactFromDAV);
            }
          };
        });
        scope.cardId = originalContact.id;
        this.initController();

        // modify the contact the make modify fn called
        scope.contact = { id: 123, firstName: 'FooX', lastName: 'BarX' };
        scope.save();
      });

      it('should call gracePeriodService.grace with the right taskId', function() {
        createVcardMock(function() {
          return {
            update: function() {
              return $q.when('a taskId');
            },
            get: function() {
              return $q.when(contactFromDAV);
            }
          };
        });

        gracePeriodService.grace = sinon.spy($q.when.bind(null));

        scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
        this.initController();
        scope.$digest();
        scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };

        scope.save();
        scope.$digest();
        expect(gracePeriodService.grace).to.have.been.calledWith(sinon.match({id: 'a taskId'}));
      });

      it('should save updated contact, contactUpdatedIds and taskId contactUpdateDataService', function() {
        gracePeriodService.grace = sinon.spy($q.when.bind(null));
        createVcardMock(function() {
          return {
            update: function() {
              return $q.when('a taskId');
            },
            get: function() {
              return $q.when(contactFromDAV);
            }
          };
        });
        scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
        this.initController();
        scope.$digest();

        scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };

        expect(contactUpdateDataService.contact).to.be.null;
        expect(contactUpdateDataService.taskId).to.be.null;
        expect(contactUpdateDataService.contactUpdatedIds).to.eql([]);

        scope.save();
        scope.$digest();

        expect(contactUpdateDataService.contact).to.eql(scope.contact);
        expect(contactUpdateDataService.taskId).to.eql('a taskId');
        expect(contactUpdateDataService.contactUpdatedIds).to.eql([1]);
      });

      it('should broadcast CONTACT_EVENTS.CANCEL_UPDATE on graceperiod fail', function() {
        createVcardMock(function() {
          return {
            update: function() {
              return $q.when('a taskId');
            },
            get: function() {
              return $q.when(contactFromDAV);
            }
          };
        });

        gracePeriodService.grace = function() {
          return $q.reject();
        };

        this.initController();
        scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX', vcard: 'vcard' };

        var spy = sinon.spy();
        $rootScope.$on(CONTACT_EVENTS.CANCEL_UPDATE, spy);
        scope.save();
        scope.$digest();
        expect(spy).to.have.been.calledOnce;
      });

      it('should not change page if the contact is invalid', function(done) {
          $location.path = function() {
            done('This test should not change the location');
          };
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };
          scope.save();
          done();
        });

      it('should show the contact without calling ContactAPIClient update fn when the contact is not modified', function() {
        var updateSpy = sinon.spy();
        var state = '/contact/show/:bookId/:bookName/:cardId';
        var stateOption = { location: 'replace' };

        $stateParams = {
          bookId: bookId,
          bookName: bookName,
          cardId: cardId
        };

        $state.go = sinon.spy();

        createVcardMock(function() {
          return {
            update: updateSpy
          };
        });

        scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
        contactUpdateDataService.contact = {};
        $controller.bind(null, 'editContactController', { $scope: scope, $stateParams: $stateParams })();

        scope.save();
        expect($state.go).to.have.been.calledWith(state, $stateParams, stateOption);
        expect(updateSpy).to.not.have.been.called;
      });
    });

    describe('The deleteContact function', function() {

      it('should call deleteContact service with the right bookId, bookName and cardId', function(done) {
          scope.bookName = 'bookName';
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          $controller.bind(null, 'editContactController', {
            $scope: scope,
            deleteContact: function(id, bookName, contact) {
              expect(id).to.deep.equal(bookId);
              expect(bookName).to.equal(scope.bookName);
              expect(contact).to.deep.equal(scope.contact);
              done();
            }
          })();

          scope.deleteContact();
          $timeout.flush();
        });
    });

  });

  describe('The contactsListController controller', function() {

    it('should display contacts as list by default', inject(function(CONTACT_LIST_DISPLAY) {
      $controller('contactsListController', {
        $scope: scope,
        user: { _id: '123' }
      });

      expect(scope.displayAs).to.equal(CONTACT_LIST_DISPLAY.list);
    }));

    it('should store the search query when user switches to contact view', function() {
      scope.contactSearch = {
        searchInput: 'some query'
      };
      sharedContactDataService.searchQuery = null;
      $controller('contactsListController', {
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
      $controller('contactsListController', {
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
      $controller('contactsListController', {
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
      $controller('contactsListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });
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

      $controller('contactsListController', {
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
      $controller('contactsListController', {
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
      $controller('contactsListController', {
        $scope: scope,
        user: { _id: '123' }
      });

      scope.contactSearch.searchInput = 'someQuery';
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
      expect(contact.deleted).to.be.true;
    });

    it('should show contact on CONTACT_EVENTS.CANCEL_DELETE while in search mode', function() {
      var contact = { lastName: 'Last' };
      $controller('contactsListController', {
        $scope: scope,
        user: { _id: '123' }
      });

      scope.contactSearch.searchInput = 'someQuery';
      $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_DELETE, contact);
      expect(contact.deleted).to.be.false;
    });

    it('should add the contact to the full contact list on CONTACT_EVENTS.CREATED event', function(done) {
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
      $controller('contactsListController', {
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

      scope.contactSearch.searchInput = null;
      $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
      $rootScope.$digest();
    });

    it('should not live refresh the search result list', function(done) {
      var contact = {
        lastName: 'Last'
      };

      createPaginationMocks(null, function() {
        return $q.reject('Fail');
      });

      var mySpy = sinon.spy();

      $controller('contactsListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        AlphaCategoryService: function() {
          return {
            init: function() {},
            addItems: function() {
              mySpy();
              return done(new Error('This test should not call addItems'));
            },
            removeItemWithId: function() {
              mySpy();
              return done(new Error('This test should not call removeItem'));
            },
            replaceItem: function() {
              mySpy();
              return done(new Error('This test should not call replaceItem'));
            },
            get: function() {}
          };
        }
      });

      scope.contactSearch.searchInput = 'someQuery';
      $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
      $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
      $rootScope.$digest();
      expect(mySpy).to.have.been.callCount(0);
      done();
    });

    it('should update the contact on CONTACT_EVENTS.UPDATED event', function(done) {
      var contact = {
        id: '123456',
        lastName: 'Last'
      };

      $controller('contactsListController', {
        $scope: scope,
        user: {
          _id: '123'
        },
        AlphaCategoryService: function() {
          return {
            replaceItem: function(contact) {
              expect(contact).to.deep.equal(contact);
              done();
            },
            get: function() {},
            init: function() {}
          };
        }
      });

      $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
      $rootScope.$digest();
      $timeout.flush();
    });

    it('should store contact id in contactUpdatedIds on CONTACT_EVENTS.UPDATED event', function(done) {
      var contact = {
        id: '123456',
        lastName: 'Last'
      };

      $controller('contactsListController', {
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

      $controller('contactsListController', {
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

      $controller('contactsListController', {
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

      $controller('contactsListController', {
        $location: locationMock,
        $scope: scope,
        user: {
          _id: '123'
        }
      });
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

      $controller('contactsListController', {
        $location: locationMock,
        sharedContactDataService: { searchQuery: query },
        $scope: scope,
        user: {
          _id: '123'
        }
      });
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

      $controller('contactsListController', {
        $scope: scope,
        $location: locationMock,
        user: {
          _id: '123'
        }
      });
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

      $controller('contactsListController', {
        $scope: scope,
        $location: locationMock,
        user: {
          _id: '123'
        }
      });
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

      $controller('contactsListController', {
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

      $controller('contactsListController', {
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

      $controller('contactsListController', {
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

      $controller('contactsListController', {
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

      $controller('contactsListController', {
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

        $controller('contactsListController', {
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
        createPaginationMocks(function() {
          return $q.when([]);
        });
        var mode = CONTACT_LIST_DISPLAY_MODES.list;

        $controller('contactsListController', {
          $scope: scope,
          user: user,
          addressbooks: addressbooks
        });
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
        $controller('contactsListController', {
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
        $controller('contactsListController', {
          $scope: scope,
          user: user
        });
        scope.clearSearchInput();
        $rootScope.$digest();
      });

      it('should update location after clear input', function(done) {
        $controller('contactsListController', {
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

        $controller('contactsListController', {
          $scope: scope,
          user: user
        });
        scope.loadContacts();
        $rootScope.$digest();
      });

      it('should spin the throbber when loading contacts', function(done) {
        var user = {_id: 123};
        var usSpinnerService = {
          spin: sinon.spy()
        };

        createPaginationMocks(function() {
          return $q.when({});
        }, function() {
          done(new Error('Should not be called'));
        });

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          user: user
        });
        scope.loadContacts();
        $rootScope.$digest();
        expect(usSpinnerService.spin).to.have.been.called;
        done();
      });

      it('should stop the throbber when contacts are loaded', function(done) {
        var user = {_id: 123};
        var usSpinnerService = {
          spin: function() {
          },
          stop: sinon.spy()
        };

        createPaginationMocks(function() {
          return $q.when({});
        }, function() {
          done(new Error('Should not be called'));
        });

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          user: user
        });
        scope.loadContacts();
        $rootScope.$digest();
        expect(usSpinnerService.stop).to.have.been.called;
        done();
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

        $controller('contactsListController', {
          $scope: scope,
          user: user
        });

        scope.loadContacts();
        scope.$digest();
      });
    });

    describe('The openContactCreation function', function() {
      it('should open the contact creation window', function() {

        var user = {
          _id: 123
        };

        scope.bookName = 'contacts';

        openContactFormMock = sinon.spy();

        $controller('contactsListController', {
          $scope: scope,
          user: user
        });

        scope.openContactCreation();
        scope.$digest();
        expect(openContactFormMock).to.have.been.calledWith(user._id, 'contacts');
      });
    });

    describe('The search function', function() {

      it('should spin the throbber when searching contacts', function(done) {
        var user = {_id: 123};
        var usSpinnerService = {
          spin: sinon.spy()
        };
        var locationService = {
          search: function() {
            return {
              q: 'a'
            };
          }
        };

        createPaginationMocks(function() {
          done(new Error('Should not be called'));
        }, function() {
          return $q.when({data: []});
        });

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          $location: locationService,
          user: user
        });
        scope.search();
        $rootScope.$digest();
        expect(usSpinnerService.spin).to.have.been.called;
        done();
      });

      it('should stop the throbber when finished searching contacts', function(done) {
        var user = {_id: 123};
        var usSpinnerService = {
          spin: function() {},
          stop: sinon.spy()
        };
        var locationService = {
          search: function() {
            return {
              q: 'a'
            };
          }
        };
        createPaginationMocks(function() {
          done(new Error('Should not be called'));
        }, function() {
          return $q.when({data: []});
        });

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          $location: locationService,
          user: user
        });
        scope.search();
        $rootScope.$digest();
        expect(usSpinnerService.stop).to.have.been.called;
        done();
      });

      it('should clean previous search results', function(done) {
        createPaginationMocks(function() {
          return $q.when([]);
        }, function() {
          done(new Error('Should not be called'));
        });

        $controller('contactsListController', {
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
        $controller('contactsListController', {
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

        $controller('contactsListController', {
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
        $controller('contactsListController', {
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

        $controller('contactsListController', {
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

      it('should displayContactError on search failure', function(done) {
        var search = 'Bruce Willis';

        createPaginationMocks(function() {
          return $q.when([]);
        }, function() {
          return $q.reject(new Error('Search failure'));
        });

        $controller('contactsListController', {
          $scope: scope,
          displayContactError: function(error) {
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

        $controller('contactsListController', {
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

        $controller('contactsListController', {
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

        $controller('contactsListController', {
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

        $controller('contactsListController', {
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

        $controller('contactsListController', {
          $scope: scope,
          user: {
            _id: '123'
          }
        });

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

        $controller('contactsListController', {
          $scope: scope,
          user: {
            _id: '123'
          }
        });

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

        $controller('contactsListController', {
          $scope: scope,
          user: {
            _id: '123'
          }
        });

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

        $controller('contactsListController', {
          $scope: scope,
          user: {
            _id: '123'
          }
        });

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

  });

  describe('The contactItemController controller', function() {

    beforeEach(function() {

      this.notificationFactory = {};
      this.gracePeriodService = {
        grace: function() {
          return {
            then: function() {}
          };
        },
        cancel: function() {}
      };
      this.$location = {
        search: function() {
          return {
            q: null
          };
        }
      };
      this.$window = {
        open: function() {}
      };
    });

    beforeEach(angular.mock.inject(function($rootScope, _CONTACT_EVENTS_, _GRACE_DELAY_) {
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.scope.contact = {
        uid: 'myuid'
      };
      this.scope.bookId = '123';
      this.CONTACT_EVENTS = _CONTACT_EVENTS_;

      this.initController = function() {
        $controller('contactItemController', {
          $scope: this.scope,
          $rootScope: this.$rootScope,
          $location: this.$location,
          $window: this.$window,
          notificationFactory: this.notificationFactory,
          gracePeriodService: this.gracePeriodService,
          CONTACT_EVENTS: _CONTACT_EVENTS_,
          GRACE_DELAY: _GRACE_DELAY_
        });
      };
    }));

    describe('the deleteContact function', function() {

      it('should call deleteContact service with the correct bookId, bookName and contact', function() {
        var self = this;
        var addressbook = {bookName: bookName, bookId: bookId};
        self.scope.contact = {
          foo: 'bar',
          addressbook: addressbook
        };

        var spy = sinon.spy();

        $controller('contactItemController', {
          $scope: this.scope,
          deleteContact: spy
        });

        this.scope.$digest();
        this.scope.deleteContact();
        expect(spy).to.have.been.calledWith(self.scope.contact.addressbook.bookId, self.scope.contact.addressbook.bookName, self.scope.contact);
      });

    });

    describe('The displayContact fn', function() {
      it('should show the contact page', function() {
        var addressbook = {bookId: '2', bookName: '3'};
        var contact = {id: '1', addressbook: addressbook};
        this.initController();
        this.scope.contact = contact;
        ContactLocationHelper.contact.show = sinon.spy();
        this.scope.displayContact();
        expect(ContactLocationHelper.contact.show).to.have.been.calledWith(addressbook.bookId, addressbook.bookName, contact.id);
      });
    });

    describe('The actionClick fn', function() {
      it('should call $window.open if action is a site web', function() {
        var location = 'http://twitter.com';
        this.initController();
        this.$window.open = sinon.spy();
        var event = {
          preventDefault: angular.noop,
          stopPropagation: angular.noop
        };
        this.scope.actionClick(event, location);
        expect(this.$window.open).to.have.been.calledOnce;
      });

      it('should not call $window.open if action is not a site web', function() {
        var location = 'mailto:someone';
        this.initController();
        this.$window.open = sinon.spy();
        var event = {
          preventDefault: angular.noop,
          stopPropagation: angular.noop
        };
        this.scope.actionClick(event, location);
        expect(this.$window.open).to.have.not.been.called;
      });

      it('should call preventDefault and stopPropagation if action is a site web', function() {
        var location = 'http://open-paas.org';
        this.initController();
        var event = {
          preventDefault: sinon.spy(),
          stopPropagation: sinon.spy()
        };
        this.scope.actionClick(event, location);
        expect(event.preventDefault).to.have.been.calledOnce;
        expect(event.stopPropagation).to.have.been.calledOnce;
      });

      it('should call stopPropagation if action is not a site web', function() {
        var location = 'mailto:someone';
        this.initController();
        var event = {
          preventDefault: sinon.spy(),
          stopPropagation: sinon.spy()
        };
        this.scope.actionClick(event, location);
        expect(event.preventDefault).to.have.not.been.called;
        expect(event.stopPropagation).to.have.been.calledOnce;
      });
    });

    describe('The editContact fn', function() {
      it('should show the contact edition page', function() {
        var addressbook = {bookId: '2', bookName: '3'};
        var contact = {id: '1', addressbook: addressbook};
        this.initController();
        this.scope.contact = contact;
        ContactLocationHelper.contact.edit = sinon.spy();
        this.scope.editContact();
        expect(ContactLocationHelper.contact.edit).to.have.been.calledWith(addressbook.bookId, addressbook.bookName, contact.id);
      });
    });
    describe('The hasContactInformationMatchQuery fn', function() {
      it('should return falsy value if there is no underneath contact of contact informations', function() {
        this.initController();
        this.scope.keySearch = 'q';
        var contact = {nickname: '', notes: '', orgName: '', orgRole: '', addresses: [], social: [], birthday: '', tags: [], urls: []};
        this.scope.contact = contact;
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;
      });

      it('should return falsy value if there are some underneath contact of contact informations but no matching', function() {
        this.initController();
        this.scope.keySearch = 'Q';
        var contactInfo = {nickname: '', notes: '', orgName: '', orgRole: '', addresses: [], social: [], birthday: '', tags: [], urls: []};
        this.scope.contact = contactInfo;

        this.scope.contact.nickname = 'nick';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.notes = 'some comment';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        scope.contact.orgName = 'company';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.orgRole = 'Jobs';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.addresses = [{type: 'Home', street: 's', city: 'c', zip: '02', country: 'co'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.social = [{type: 'twitter', value: '@some social'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.birthday = 'Sat Apr 02 2016 00:00:00 GMT+0700 (ICT)';
        this.scope.formattedBirthday;
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.tags = [{text: 'tags'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;

        this.scope.contact.urls = [{value: 'some websites'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.not.ok;
      });

      it('should return truthy value if there are some matching underneath contact of contact informations', function() {
        this.initController();
        this.scope.keySearch = '02';
        var contact = {nickname: '', notes: '', orgName: '', orgRole: '', addresses: [], social: [], birthday: '', tags: [], urls: []};
        this.scope.contact = contact;

        this.scope.contact.nickname = '02nick';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.notes = 'some comment 02';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.orgName = '02 company';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.orgRole = '02 Jobs';
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.addresses = [{type: 'Home', street: 's', city: 'c', zip: '02', country: 'co'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.social = [{type: 'Skype', value: '02some social'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.birthday = 'Sat Apr 02 2016 00:00:00 GMT+0700 (ICT)';
        this.scope.formattedBirthday;
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.tags = [{text: '02'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;

        this.scope.contact.urls = [{value: 'http://02.com'}];
        expect(this.scope.hasContactInformationMatchQuery()).to.be.ok;
      });

    });
  });

  describe('The contactCategoryLetterController controller', function() {

    beforeEach(angular.mock.inject(function($rootScope, _CONTACT_SCROLL_EVENTS_, $browser) {
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.event = _CONTACT_SCROLL_EVENTS_;
      this.browser = $browser;

      this.initController = function() {
        $controller('contactCategoryLetterController', {
          $scope: this.scope
        });
      };
    }));

    it('should update categoryLetter value', function() {
      this.scope.headerDisplay = {
        categoryLetter: 'B',
        letterExists: false
      };
      this.initController();
      this.scope.$digest();
      this.$rootScope.$broadcast(this.event, 'A');
      this.browser.defer.flush();
      expect(this.scope.headerDisplay).to.deep.equal({
        categoryLetter: 'A',
        letterExists: true
      });
    });

    describe('The getContactTitleDisplayCondition fn', function() {
      it('should return correct value ', function() {
        $controller('contactCategoryLetterController', {
          $scope: scope,
          user: {
            _id: '123'
          }
        });

        function testGetContactTitleDisplayCondition(headerDisplayLetterExists, displayAs, searchInput, returnValue) {
          scope.headerDisplay = {letterExists: headerDisplayLetterExists};
          scope.displayAs = displayAs;
          scope.contactSearch = { searchInput: searchInput };
          expect(scope.getContactTitleDisplayCondition()).to.equal(returnValue);
        }

        testGetContactTitleDisplayCondition(false, 'cards', '', true);
        testGetContactTitleDisplayCondition(true, 'list', '', false);
        testGetContactTitleDisplayCondition(false, 'list', '', true);
        testGetContactTitleDisplayCondition(false, 'cards', 'a', false);
      });
    });
  });
});
