'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts controller module', function() {

  var $rootScope, $controller, $timeout, scope, ContactShell, AddressBookPaginationService,
    notificationFactory, $location, $state, $stateParams, selectionService, $alert, gracePeriodService,
    contactUpdateDataService, CONTACT_EVENTS,
    ContactAPIClient, VcardBuilder, ContactLocationHelper, openContactForm, openContactFormMock,
    ContactShellDisplayBuilder, esnI18nServiceMock, contactAddressbookDisplayService, contactService;

  var bookId = '123456789', bookName = 'bookName', cardId = '987654321';

  beforeEach(function() {

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

    AddressBookPaginationService = function(pagination) {
      this.pagination = pagination;
    };

    AddressBookPaginationService.prototype.loadNextItems = function(options) {
      if (this.pagination && this.pagination.loadNextItems) {
        return this.pagination.loadNextItems(options);
      }

      return $q.when({data: []});
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
    openContactForm = function(options) {
      return openContactFormMock(options);
    };

    angular.mock.module('esn.core');

    module('linagora.esn.contact', function($provide) {
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
      $provide.value('openContactForm', openContactForm);
      $provide.value('ContactShellDisplayBuilder', ContactShellDisplayBuilder);
      $provide.value('esnI18nService', esnI18nServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$timeout_, _$state_, _contactAddressbookDisplayService_, _CONTACT_EVENTS_, _contactService_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    $state = _$state_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    contactService = _contactService_;

    scope = $rootScope.$new();
    scope.contact = {};
    contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;
    CONTACT_EVENTS = _CONTACT_EVENTS_;
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
          return {
            vcard: vcardFn,
            get: function() { return $q.when({ bookId: bookId, bookName: bookName, name: 'My Contacts' }); }
          };
        }
      };
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

      it('should not call contactService.createContact when already calling it', function(done) {
        scope.calling = true;
        contactService.createContact = function() {
          return done(new Error('This test should not call ContactAPIClient'));
        };
        scope.accept();
        done();
      });

      it('should not call contactService.createContact when contact is not valid', function(done) {
        contactService.createContact = function() {
          return done(new Error('This test should not call ContactAPIClient'));
        };
        scope.accept();
        done();
      });

      it('should not grace the request when contact is not valid', function(done) {
        gracePeriodService.grace = done;

        scope.accept();
        scope.$digest();

        done();
      });

      it('should call contactService.createContact with right bookId, bookName and contact', function() {
        scope.bookId = bookId;
        scope.bookName = bookName;
        scope.contact = { firstName: 'Foo', lastName: 'Bar' };
        contactService.createContact = sinon.stub().returns($q.when({}));
        scope.accept();

        expect(contactService.createContact).to.have.been.calledWith({ bookId: bookId, bookName: bookName }, scope.contact);
        scope.$digest();
      });

      it('should change page on contact create success', function(done) {
        scope.contact = {id: 1, firstName: 'Foo', lastName: 'Bar'};
        $state.go = function(to, params, options) {
          expect(to).to.equal('contact.addressbooks.show');
          expect(params.bookId).to.equal(bookId);
          expect(params.bookName).to.equal(scope.bookName);
          expect(params.cardId).to.equal(scope.contact.id);
          expect(options.location).to.equal('replace');
          done();
        };

        createVcardMock(function() {
          return {
            create: function() {
              return $q.when({});
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
              return $q.when({});
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
              return $q.when({});
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
              return $q.when({});
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
              return $q.when({});
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
              return $q.when({});
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
              return $q.when({});
            },
            remove: function() {
              return $q.when();
            }
          };
        });

        scope.accept();
        scope.$digest();
        expect(openContactFormMock).to.have.been.calledOnce;
        expect(openContactFormMock).to.have.been.calledWith({
          bookId: bookId,
          bookName: bookName,
          contact: scope.contact,
          shouldReplaceState: true
        });
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
      it('should call contactService.updateContact to update the contact', function() {
        var originalContact = {
          id: 123,
          firstName: 'Foo',
          lastName: 'Bar'
        };
        contactService.getContact = sinon.stub().returns($q.when(originalContact));
        contactService.updateContact = sinon.stub().returns($q.when());

        this.initController();

        // modify the contact the make modify fn called
        scope.contact = {
          id: 123,
          firstName: 'FooX',
          lastName: 'BarX'
        };
        scope.bookId = '123';
        scope.bookName = 'abc';
        scope.save();
        expect(contactService.updateContact).to.have.been.calledWith({ bookId: '123', bookName: 'abc' }, scope.contact);
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

        scope.contact = {
          id: 1,
          firstName: 'Foo',
          lastName: 'Bar',
          addressbook: {
            bookId: '123',
            bookName: 'abc'
          }
        };
        this.initController();
        scope.$digest();
        scope.contact = {
          id: 1,
          firstName: 'FooX',
          lastName: 'BarX',
          addressbook: {
            bookId: '123',
            bookName: 'abc'
          }
        };

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
        scope.contact = {
          id: 1,
          firstName: 'FooX',
          lastName: 'BarX',
          addressbook: {
            bookId: '123',
            bookName: 'abc'
          }
        };
        this.initController();
        scope.$digest();

        scope.contact = {
          id: 1,
          firstName: 'FooX',
          lastName: 'BarX',
          addressbook: {
            bookId: '123',
            bookName: 'abc'
          }
        };

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
        scope.contact = {
          id: 1,
          firstName: 'FooX',
          lastName: 'BarX',
          vcard: 'vcard',
          addressbook: {
            bookId: '123',
            bookName: 'abc'
          }
        };

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
        scope.contact = {
          id: 1,
          firstName: 'FooX',
          lastName: 'BarX',
          addressbook: {
            bookId: '123',
            bookName: 'abc'
          }
        };
          this.initController();
          scope.contact = {
            id: 1,
            firstName: 'FooX',
            lastName: 'BarX',
            addressbook: {
              bookId: '123',
              bookName: 'abc'
            }
          };
          scope.save();
          done();
        });

      it('should show the contact without calling ContactAPIClient update fn when the contact is not modified', function() {
        var updateSpy = sinon.spy();
        var state = 'contact.addressbooks.show';
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
        this.scope.displayShell = {
          displayContact: sinon.spy()
        };
        this.scope.displayContact();
        expect(this.scope.displayShell.displayContact).to.have.been.called;
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
