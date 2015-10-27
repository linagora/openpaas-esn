'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  var $rootScope, $controller, $timeout, scope, bookId = '123456789', contactsService, headerService,
      notificationFactory, usSpinnerService, $location, $route, selectionService, $alert, gracePeriodService, sharedContactDataService, sortedContacts, liveRefreshContactService, gracePeriodLiveNotification, contactUpdateDataService, $window, CONTACT_EVENTS;

  beforeEach(function() {
    usSpinnerService = {
      spin: function() {},
      stop: function() {}
    },
    contactsService = {
      shellToVCARD: function() {
        return scope.contact;
      },
      getCard: function() {
        return $q.when(scope.contact);
      },
      ContactsShell: function() {}
    };
    liveRefreshContactService = {
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
    $route = {
      current: {
        params: {
          bookId: bookId
        }
      }
    };
    selectionService = {
      clear: function() {}
    };
    $alert = {
      alert: function() {}
    };
    gracePeriodService = {
      clientGrace: function() {
        return {
          then: function() {}
        };
      },
      grace: function() {
        return {
          then: function() {}
        };
      },
      cancel: function() {},
      flush: function() {}
    };

    gracePeriodLiveNotification = {
      registerListeners: function() {}
    };

    $window = {
      addEventListener: function() {}
    };

    contactUpdateDataService = { contact: null, taskId: null };

    headerService = {
      subHeader: {
        addInjection: function() {},
        resetInjections: function() {}
      }
    };

    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');

    module('linagora.esn.contact', function($provide) {
      $provide.value('contactsService', contactsService);
      $provide.value('liveRefreshContactService', liveRefreshContactService);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('$location', $location);
      $provide.value('selectionService', selectionService);
      $provide.value('$route', $route);
      $provide.value('$alert', function(options) { $alert.alert(options); });
      $provide.value('gracePeriodService', gracePeriodService);
      $provide.value('gracePeriodLiveNotification', gracePeriodLiveNotification);
      $provide.value('contactUpdateDataService', contactUpdateDataService);
      $provide.value('usSpinnerService', usSpinnerService);
      $provide.value('$window', $window);
      $provide.value('headerService', headerService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$timeout_, _sharedContactDataService_, ALPHA_ITEMS, _CONTACT_EVENTS_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    sharedContactDataService = _sharedContactDataService_;
    sortedContacts = ALPHA_ITEMS.split('').reduce(function(a, b) {
      a[b] = [];

      return a;
    }, {});

    scope = $rootScope.$new();
    scope.contact = {};
    CONTACT_EVENTS = _CONTACT_EVENTS_;
  }));

  describe('the newContactController', function() {

    beforeEach(function() {
      $controller('newContactController', {
        $scope: scope
      });
    });

    it('should initialize $scope.contact to an already existing one when defined', function() {
      var scope = {},
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
      var scope = {},
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

    it('should go back to the list of contacts when close is called', function(done) {
      $location.path = function(path) {
        expect(path).to.equal('/contact');
        done();
      };

      scope.close();
    });

    describe('the accept function', function() {

      it('should not call contactsService.create when already calling it', function(done) {
        scope.calling = true;
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
        };
        scope.accept();
        done();
      });

      it('should not call contactsService.create when contact is not valid', function(done) {
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
        };
        scope.accept();
        done();
      });

      it('should display an error when contact is not valid', function(done) {
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
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

      it('should call contactsService.create with right bookId and contact', function(done) {
        scope.contact = { firstName: 'Foo', lastName: 'Bar' };
        contactsService.create = function(id, contact) {
          expect(id).to.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);

          done();
        };
        scope.accept();
      });

      it('should change page on contactsService.create success', function(done) {
        scope.contact = {id: 1, firstName: 'Foo', lastName: 'Bar'};

        $location.url = function(path) {
          expect(path).to.equal('/contact/show/' + bookId + '/1');

          done();
        };

        contactsService.create = function() {
          return $q.when();
        };

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

      it('should notify user on contactsService.create failure', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        $location.path = function() {
          done(new Error('This test should not change the location'));
        };

        notificationFactory.weakError = function() {
          done();
        };

        contactsService.create = function() {
          return $q.reject('WTF');
        };

        scope.accept();
        scope.$digest();
      });

      it('should set back the calling flag to false when complete', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};
        $location.path = function() {};

        contactsService.create = function() {
          return $q.when();
        };

        scope.accept().then(function() {
          expect(scope.calling).to.be.false;

          done();
        });
        scope.$digest();
      });

      it('should grace the request using the default delay on success', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.clientGrace = function(taskId, text, linkText, delay) {
          expect(delay).to.not.exist;
          done();
        };

        contactsService.create = function() {
          return $q.when();
        };

        scope.accept();
        scope.$digest();
      });

      it('should display correct title and link during the grace period', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar', id: 'myTaskId'};

        gracePeriodService.clientGrace = function(text, linkText, delay) {
          expect(text).to.equals('You have just created a new contact (Foo Bar).');
          expect(linkText).to.equals('Cancel and back to edition');
          expect(delay).to.not.exist;
          done();
        };

        contactsService.create = function() {
          return $q.when();
        };

        scope.accept();
        scope.$digest();
      });

      it('should not grace the request on contactsService.create failure', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.clientGrace = done;

        contactsService.create = function() {
          return $q.reject();
        };

        scope.accept();
        scope.$digest();

        done();
      });

      it('should delete the contact if the user cancels during the grace period', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.clientGrace = function() {
          return $q.when({cancelled: true,
            success: function(textToDisplay) {
            },
            error: function(textToDisplay) {
            }});
        };
        contactsService.create = function() {
          return $q.when();
        };
        contactsService.remove = function(id, contact) {
          expect(id).to.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);

          done();
        };

        scope.accept();
        scope.$digest();
      });

      it('should notice the user that the contact creation can\'t be cancelled', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.clientGrace = function() {
          return $q.when({cancelled: true,
            success: function(textToDisplay) {
            },
            error: function(textToDisplay) {
              done();
            }});
        };
        contactsService.create = function() {
          return $q.when();
        };
        contactsService.remove = function(id, contact) {
          expect(id).to.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);

          return $q.reject();
        };

        scope.accept();
        scope.$digest();
      });

      it('should go back to the editing form if the user cancels during the grace period, saving the contact', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar', title: 'PDG'};

        gracePeriodService.clientGrace = function() {
          return $q.when({cancelled: true,
            success: function(textToDisplay) {
            },
            error: function(textToDisplay) {
            }});
        };
        contactsService.create = function() {
          return $q.when();
        };
        contactsService.remove = function(id, contact) {
          $location.url = function(path) {
            expect(path).to.equal('/contact/new/' + bookId);
            expect(sharedContactDataService.contact).to.deep.equal(scope.contact);

            done();
          };

          return $q.when();
        };

        scope.accept();
        scope.$digest();
      });

    });
  });

  describe('The showContactController', function() {

    beforeEach(function() {
      this.initController = $controller.bind(null, 'showContactController', { $scope: scope});
    });

    it('should inject show header', function(done) {
      headerService.subHeader.addInjection = function(directive) {
        expect(directive).to.equal('contact-show-subheader');
        done();
      };
      this.initController();
    });

    it('should call headerService to reset injections in the subheader on route change', function(done) {
      headerService.subHeader.resetInjections = done;
      this.initController();
      scope.$emit('$routeChangeStart', {});
    });

    it('should go back to the list of contacts when close is called', function(done) {
      $location.path = function(path) {
        expect(path).to.equal('/contact');
        done();
      };

      this.initController();
      scope.close();
    });

    it('should display an error if the contact cannot be loaded initially', function(done) {
      contactsService.getCard = function() {
        return $q.reject('WTF');
      };
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

        scope.$emit('$routeChangeStart', {
          originalPath: '/some/path/other/than/contact/edit'
        });

        scope.$digest();
        expect(contactUpdateDataService.contact).to.be.null;
      });

      it('should update contactUpdateDataService.contact when ther user edits contact again', function() {
        contactUpdateDataService.contact = { id: 'myId' };
        this.initController();

        scope.contact = { id: 'myOtherId' };
        scope.bookId = '123';
        scope.cardId = '456';

        scope.$emit('$routeChangeStart', {
          originalPath: '/contact/edit/:bookId/:cardId',
          params: {
            bookId: '123',
            cardId: '456'
          }
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

        scope.$emit('$routeChangeStart', {
          originalPath: '/some/path/other/than/contact/edit'
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

      it('should go back to the list of contacts when called', function(done) {
        $location.path = function(path) {
          expect(path).to.equal('/contact');
          done();
        };
        this.initController();
        scope.deleteContact();
      });

      it('should call contactsService.remove with the right bookId and cardId', function(done) {
        scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
        contactsService.deleteContact = function(id, contact) {
          expect(id).to.deep.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);
          done();
      };

        contactsService.getCard = function(path) {
          return $q.when({_id: 1, firstName: 'Foo', lastName: 'Bar'});
        };

        this.initController();
        scope.deleteContact();
        $timeout.flush();
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

    beforeEach(function() {
      this.initController = $controller.bind(null, 'editContactController', { $scope: scope});
    });

    it('should inject edition header', function(done) {
      headerService.subHeader.addInjection = function(directive) {
        expect(directive).to.equal('contact-edit-subheader');
        done();
      };
      this.initController();
    });

    it('should call headerService to reset injections in the subheader on route change', function(done) {
      headerService.subHeader.resetInjections = done;
      this.initController();
      scope.$emit('$routeChangeStart', {});
    });

    it('should take contact from contactUpdateDataService if there was a graceperiod', function() {
      contactUpdateDataService.contact = { id: 'myId' };
      contactsService.shellToVCARD = function() {
        return 'vcard';
      };
      contactsService.getCard = sinon.spy();
      this.initController();
      expect(scope.contact).to.eql({ id: 'myId', vcard: 'vcard' });
      expect(contactUpdateDataService.contact).to.be.null;
      expect(contactsService.getCard.callCount).to.equal(0);
    });

    describe('The save function', function() {

        it('should call contactsService.modify with the right bookId and cardId', function(done) {
          contactsService.modify = function(id, contact) {
            expect(id).to.deep.equal(bookId);
            expect(contact).to.deep.equal(scope.contact);
            done();
          };
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          // modify the contact the make modify fn called
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };
          scope.save();
        });

        it('should call gracePeriodService.grace with the right taskId', function(done) {
          contactsService.modify = function() {
            return $q.when('a taskId');
          };

          gracePeriodService.grace = function(taskId) {
            expect(taskId).to.equal('a taskId');
            done();
          };

          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };

          scope.save();
          scope.$digest();
        });

        it('should register graceperiod live notification with the right taskId', function(done) {
          gracePeriodLiveNotification.registerListeners = function(taskId) {
            expect(taskId).to.equal('a taskId');
            done();
          };

          contactsService.modify = function() {
            return $q.when('a taskId');
          };
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };
          scope.save();
          scope.$digest();
        });

        it('should save updated contact and taskId contactUpdateDataService', function() {
          contactsService.modify = function() {
            return $q.when('a taskId');
          };
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };

          expect(contactUpdateDataService.contact).to.be.null;
          expect(contactUpdateDataService.taskId).to.be.null;

          scope.save();
          scope.$digest();

          expect(contactUpdateDataService.contact).to.eql(scope.contact);
          expect(contactUpdateDataService.taskId).to.eql('a taskId');
        });

        it('should broadcast CONTACT_EVENTS.CANCEL_UPDATE on cancel', function(done) {
          contactsService.modify = function() {
            return $q.when('a taskId');
          };

          gracePeriodService.grace = function() {
            return $q.when({
              cancelled: true,
              success: function() {}
            });
          };

          gracePeriodService.cancel = function() {
            return $q.when();
          };

          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };

          $rootScope.$on(CONTACT_EVENTS.CANCEL_UPDATE, function() {
            done();
          });

          scope.save();
          scope.$digest();
        });

        it('should broadcast CONTACT_EVENTS.CANCEL_UPDATE on task failure', function(done) {
          contactsService.modify = function() {
            return $q.when('a taskId');
          };

          gracePeriodLiveNotification.registerListeners = function(taskId, onError) {
            expect(taskId).to.equal('a taskId');
            onError();
          };

          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };

          $rootScope.$on(CONTACT_EVENTS.CANCEL_UPDATE, function() {
            done();
          });

          scope.save();
          scope.$digest();
        });

        it('should not change page if the contact is invalid', function(done) {
          $location.path = function() {
            done('This test should not change the location');
          };
          contactsService.modify = function() {
            return $q.reject();
          };
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          this.initController();
          scope.contact = { id: 1, firstName: 'FooX', lastName: 'BarX' };
          scope.save();
          done();
        });

        it('should show the contact without calling modify fn when the contact is not modified', function(done) {

          $location.path = function(url) {
            expect(url).to.equal('/contact/show/123/xyz');
            done();
          };
          contactsService.modify = function() {
            done('Should not call this function');
            return $q.reject();
          };

          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          contactUpdateDataService.contact = true;
          this.initController();
          scope.bookId = '123';
          scope.cardId = 'xyz';

          scope.save();
        });

    });

    describe('The deleteContact function', function() {

        it('should go back to the list of contacts when called', function(done) {
          $location.path = function(path) {
            expect(path).to.equal('/contact');
            done();
          };
          this.initController();
          scope.deleteContact();
        });

        it('should call contactsService.remove with the right bookId and cardId', function(done) {
          scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
          contactsService.deleteContact = function(id, contact) {
            expect(id).to.deep.equal(bookId);
            expect(contact).to.deep.equal(scope.contact);
            done();
          };

          contactsService.getCard = function(path) {
            return $q.when({_id: 1, firstName: 'Foo', lastName: 'Bar'});
          };

          this.initController();
          scope.deleteContact();
          $timeout.flush();
        });
    });

  });

  describe('The contactsListController controller', function() {

    it('should inject show header', function(done) {
      headerService.subHeader.addInjection = function(directive) {
        expect(directive).to.equal('contact-list-subheader');
        done();
      };
      $controller('contactsListController', {
        $scope: scope,
        headerService: headerService,
        user: { _id: '123' }
      });
    });

    it('should gracePeriodService.flushAllTasks $on(\'$destroy\')', function() {
      gracePeriodService.flushAllTasks = sinon.spy();
      $controller('contactsListController', {
        $scope: scope,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
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
      $controller('contactsListController', {
        $scope: scope,
        $window: window,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
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
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
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
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
        user: { _id: '123' }
      });

      scope.searchInput = 'someQuery';
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
      expect(contact.deleted).to.be.true;
    });

    it('should show contact on CONTACT_EVENTS.CANCEL_DELETE while in search mode', function() {
      var contact = { lastName: 'Last' };
      $controller('contactsListController', {
        $scope: scope,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
        user: { _id: '123' }
      });

      scope.searchInput = 'someQuery';
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
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
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

      scope.searchInput = null;
      $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
      $rootScope.$digest();
    });

    it('should not live refresh the search result list', function(done) {
      var contact = {
        lastName: 'Last'
      };

      var mySpy = sinon.spy();

      $controller('contactsListController', {
        $scope: scope,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
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

      scope.searchInput = 'someQuery';
      $rootScope.$broadcast(CONTACT_EVENTS.CREATED, contact);
      $rootScope.$broadcast(CONTACT_EVENTS.UPDATED, contact);
      $rootScope.$broadcast(CONTACT_EVENTS.DELETED, contact);
      $rootScope.$digest();
      expect(mySpy).to.have.been.callCount(0);
      done();
    });

    it('should update the contact on CONTACT_EVENTS.UPDATED event', function(done) {
      var contact = {
        lastName: 'Last'
      };

      $controller('contactsListController', {
        $scope: scope,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
        user: {
          _id: '123'
        },
        AlphaCategoryService: function() {
          return {
            replaceItem: function(item) {
              expect(item).to.deep.equal(contact);

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

    it('should load contact list when no query is specified in the URL' , function(done) {
      var query = null;
      var locationMock = {
        search: function() {
          return {
            q: query
          };
        }
      };
      contactsService.search = function() {
        return done(new Error('This test should not call contactsService.search'));
      };
      contactsService.list = function() {
        done();
      };
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
      contactsService.search = function() {
        return done(new Error('This test should not call contactsService.search'));
      };
      contactsService.list = function() {
        return done(new Error('This test should not call contactsService.list'));
      };
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

    it('should load search result list when a query is specified in the URL' , function(done) {
      var query = 'Chuck Norris';
      var locationMock = {
        search: function() {
          return {
            q: query
          };
        }
      };
      contactsService.list = function() {
        return done(new Error('This test should not call contactsService.list'));
      };
      contactsService.search = function() {
        expect(scope.searchInput).to.equal(query);
        done();
      };
      $controller('contactsListController', {
        $location: locationMock,
        $scope: scope,
        user: {
          _id: '123'
        }
      });
    });

    it('should refresh list on route update when the queries in the URL and in the search input are different' , function(done) {
      var query = 'QueryA';
      var mySpy = sinon.spy();
      var locationMock = {
        search: function() {
          return {
            q: query
          };
        }
      };
      contactsService.search = function() {
        expect(scope.searchInput).to.equal(query);
        mySpy();
        return $q.when({
        hits_list: [],
          total_hits: 0
        });
      };
      $controller('contactsListController', {
        $scope: scope,
        $location: locationMock,
        user: {
          _id: '123'
        }
      });
      scope.searchInput = 'QueryB';
      scope.$digest();
      $rootScope.$broadcast('$routeUpdate');
      expect(scope.searchInput).to.equal(query);
      expect(mySpy).to.have.been.calledTwice;
      done();
    });

    it('should not refresh list on route update when the queries in the URL and in the search input are the same' , function(done) {
      var query = 'QueryA';
      var mySpy = sinon.spy();
      var locationMock = {
        search: function() {
          return {
            q: query
          };
        }
      };
      contactsService.search = function() {
        expect(scope.searchInput).to.equal(query);
        mySpy();
        return $q.when([]);
      };
      $controller('contactsListController', {
        $scope: scope,
        $location: locationMock,
        user: {
          _id: '123'
        }
      });
      scope.searchInput = 'QueryA';
      $rootScope.$broadcast('$routeUpdate');
      expect(scope.searchInput).to.equal(query);
      expect(mySpy).to.have.been.calledOnce;
      done();
    });

    it('should add no item to the categories when contactsService.list returns an empty list', function() {
      contactsService.list = function() {
        return $q.when([]);
      };

      $controller('contactsListController', {
        $scope: scope,
        user: {
          _id: '123'
        }
      });

      $rootScope.$digest();

      $timeout(function() {
        expect(scope.sorted_contacts).to.deep.equal(sortedContacts);
      });
    });

    it('should sort contacts by FN', function() {
      var contactWithA = { displayName: 'A B'},
          contactWithC = { displayName: 'C D' };

      contactsService.list = function() {
        return $q.when([contactWithA, contactWithC]);
      };

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
      });
    });

    it('should correctly sort contacts when multiple contacts have the same FN', function() {
      var contact1 = { displayName: 'A B'},
          contact2 = { displayName: 'A B' };

      contactsService.list = function() {
        return $q.when([contact1, contact2]);
      };

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
      });
    });

    it('should correctly sort contacts when multiple contacts have the same beginning of FN', function() {
      var contact1 = { displayName: 'A B'},
          contact2 = { displayName: 'A C' };

      contactsService.list = function() {
        return $q.when([contact1, contact2]);
      };

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
      });
    });

    it('should correctly sort contacts when some contacts does not have FN', function() {
      var contact1 = { firstName: 'A'},
          contact2 = { displayName: 'A C'},
          contact3 = { id: '123' };

      contactsService.list = function() {
        return $q.when([contact1, contact2, contact3]);
      };

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
      });
    });

    it('should fire viewRenderFinished event to scroll to old position', function(done) {
      scope.$on('viewRenderFinished', function() {
        done();
      });

      $controller('contactsListController', {
        $scope: scope,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
        user: {
          _id: '123'
        }
      });

      $rootScope.$broadcast('ngRepeatFinished');
    });

    describe('The clearSearchInput function', function() {

      it('should clear search input and all search results', function() {
        var user = {_id: 123};
        scope.searchInput = 'name';
        scope.searchResult = {
          data: ['name1', 'name2', 'name3']
        };
        scope.totalHits = 3;
        scope.loadContacts = function() {};
        $controller('contactsListController', {
          $scope: scope,
          contactsService: contactsService,
          user: user
        });
        scope.clearSearchInput();
        expect(scope.searchInput).to.be.null;
        expect(scope.searchResult).to.deep.equal({});
        expect(scope.totalHits).to.equal(0);
      });

      it('should load contacts after clear input', function(done) {
        var user = {_id: 123};
        scope.loadContacts = sinon.spy();
        var contactsService = {
          list: function() {
            done();
          }
        };
        $controller('contactsListController', {
          $scope: scope,
          contactsService: contactsService,
          user: user
        });
        scope.clearSearchInput();
        $rootScope.$digest();
        expect(scope.loadContacts).to.have.been.calledOnce;
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

      it('should call the contactsService.list fn', function(done) {
        var user = {_id: 123};
        var contactsService = {
          list: function(bookId) {
            expect(bookId).to.equal(user._id);
            done();
          }
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: contactsService,
          user: user
        });
        scope.loadContacts();
        $rootScope.$digest();
      });

      it('should spin the throbber when loading contacts', function() {
        var user = {_id: 123};
        var usSpinnerService = {
          spin: sinon.spy()
        };
        var contactsService = {
          list: function() {
            return $q.when({});
          }
        };
        scope.currentPage = 1;

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          contactsService: contactsService,
          user: user
        });
        scope.loadContacts();
        $rootScope.$digest();
        expect(usSpinnerService.spin).to.have.been.called;
      });

      it('should stop the throbber when contacts are loaded', function() {
        var user = {_id: 123};
        var usSpinnerService = {
          spin: function() {
          },
          stop: sinon.spy()
        };
        var contactsService = {
          list: function() {
            return $q.when({});
          }
        };
        scope.currentPage = 1;

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          contactsService: contactsService,
          user: user
        });
        scope.loadContacts();
        $rootScope.$digest();
        expect(usSpinnerService.stop).to.have.been.called;
      });

      it('should display error when contactsService.list fails', function(done) {
        var user = {_id: 123};
        var defer = $q.defer();
        defer.reject();
        var contactsService = {
          list: function() {
            return defer.promise;
          }
        };
        $alert.alert = function(options) {
          expect(options.content).to.match(/Can not get contacts/);

          done();
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: contactsService,
          user: user
        });

        scope.loadContacts();
        scope.$digest();
      });
    });

    describe('The openContactCreation function', function() {
      it('should open the contact creation window', function(done) {

        var user = {
          _id: 123
        };

        $location.url = function(url) {
          expect(url).to.equal('/contact/new/' + user._id);
          done();
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when({});
            }
          },
          user: user
        });

        scope.openContactCreation();
      });
    });

    describe('The search function', function() {

      it('should spin the throbber when searching contacts', function() {
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
        var contactsService = {
          search: function() {
            return $q.when({hits_list: []});
          }
        };

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          contactsService: contactsService,
          $location: locationService,
          user: user
        });
        scope.search();
        $rootScope.$digest();
        expect(usSpinnerService.spin).to.have.been.called;
      });

      it('should stop the throbber when finished searching contacts', function() {
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
        var contactsService = {
          search: function() {
            return $q.when({hits_list: []});
          }
        };

        $controller('contactsListController', {
          $scope: scope,
          usSpinnerService: usSpinnerService,
          contactsService: contactsService,
          $location: locationService,
          user: user
        });
        scope.search();
        $rootScope.$digest();
        expect(usSpinnerService.stop).to.have.been.called;
      });

      it('should clean previous search results', function() {
        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            }
          },
          user: {
            _id: '123'
          }
        });

        scope.searchResult = 1;
        scope.loadContacts = function() {};
        scope.search();
        scope.$digest();
        expect(scope.searchResult).to.deep.equal({});
        expect(scope.currentPage).to.equal(0);
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

      it('should clean search result data', function() {
        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            }
          },
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
      });

      it('should quit search mode and get all the user contacts when searchInput is undefined', function(done) {
        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            }
          },
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

      it('should clean pagination data', function() {
        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            }
          },
          user: {
            _id: '123'
          }
        });
        scope.loadContacts = function() {};
        scope.$digest();
        scope.currentPage = 10;
        scope.nextPage = 11;

        scope.search();
        scope.$digest();
        expect(scope.currentPage).to.equal(0);
        expect(scope.nextPage).to.equal(0);
      });

      it('should call contactsService.search with right values', function(done) {
        var search = 'Bruce Willis';

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            },
            search: function(bookId, userId, data) {
              expect(scope.searchMode).isTrue;
              expect(bookId).to.equal(scope.bookId);
              expect(userId).to.equal(scope.user._id);
              expect(data).to.equal(search);
              done();
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });

        scope.searchInput = search;
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
          hits_list: [contactWithA, contactWithC]
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([contactWithA, contactWithB, contactWithC]);
            },
            search: function() {
              return $q.when(result);
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });

        scope.searchInput = search;
        scope.totalHits = 0;
        scope.search();
        scope.$digest();

        expect(scope.searchResult.data).to.deep.equal(result.hits_list);
        expect(scope.currentPage).to.deep.equal(result.current_page);
        expect(scope.searchResult.count).to.equal(2);
        expect(scope.searchResult.formattedResultsCount).to.exist;
        expect(scope.searchFailure).to.be.false;
      });

      it('should displayContactError on search failure', function(done) {
        var search = 'Bruce Willis';

        $controller('contactsListController', {
          $scope: scope,
          displayContactError: function(error) {
            expect(error).to.match(/Can not search contacts/);
            done();
          },
          contactsService: {
            list: function() {
              return $q.when([]);
            },
            search: function() {
              return $q.reject(new Error('WTF'));
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });

        scope.searchInput = search;
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
          hits_list: [contactWithA, contactWithB]
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([contactWithA, contactWithB, contactWithC, contactWithD, contactWithE]);
            },
            search: function() {
              return $q.when(result);
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });

        scope.searchInput = search;
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
          hits_list: [contactWithA, contactWithB]
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([contactWithA, contactWithB, contactWithC, contactWithD, contactWithE]);
            },
            search: function() {
              return $q.when(result);
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });
        scope.$digest();

        scope.searchInput = search;
        scope.totalHits = 0;
        scope.search();
        scope.$digest();
        expect(scope.searchFailure).to.be.false;
        expect(scope.lastPage).to.be.false;
      });

      it('should prevent fetching next result page when there are no more results', function() {
        var search = 'Bruce Willis';

        var contactWithA = { displayName: 'A B'};
        var contactWithB = { displayName: 'B C'};
        var contactWithC = { displayName: 'C D'};
        var contactWithD = { displayName: 'D E'};
        var contactWithE = { displayName: 'E F'};

        var result = {
          total_hits: 2,
          hits_list: [contactWithA, contactWithB]
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([contactWithA, contactWithB, contactWithC, contactWithD, contactWithE]);
            },
            search: function() {
              return $q.when(result);
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });
        scope.$digest();

        scope.searchInput = search;
        scope.totalHits = 0;
        scope.search();
        scope.$digest();
        expect(scope.lastPage).to.be.true;
      });

      it('should prevent fetching next result page when the previous search fails', function() {
        var search = 'Bruce Willis';

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            },
            search: function() {
              return $q.reject(new Error('WTF'));
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });

        scope.searchInput = search;
        scope.search();
        scope.$digest();
        expect(scope.searchFailure).to.be.true;
      });

      it('should prevent search when previous search is not complete', function() {
        var search = 'Bruce Willis';
        var called = 0;

        $controller('contactsListController', {
          $scope: scope,
          contactsService: {
            list: function() {
              return $q.when([]);
            },
            search: function() {
              called++;
              // the search will be never resolved
              return $q.defer().promise;
            }
          },
          user: {
            _id: '123'
          },
          bookId: '456'
        });

        scope.searchInput = search;
        scope.search();
        scope.$digest();
        scope.search();
        scope.$digest();
        expect(called).to.equal(1);
      });
    });
  });

  describe('The contactItemController controller', function() {

    beforeEach(function() {

      this.notificationFactory = {};
      this.contactsService = {};
      this.gracePeriodService = {
        grace: function() {
          return {
            then: function() {}
          };
        },
        cancel: function() {}
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
          contactsService: this.contactsService,
          notificationFactory: this.notificationFactory,
          gracePeriodService: this.gracePeriodService,
          CONTACT_EVENTS: _CONTACT_EVENTS_,
          GRACE_DELAY: _GRACE_DELAY_
        });
      };
    }));

    describe('the deleteContact function', function() {

      beforeEach(function() {
        this.initController();
      });

      it('should call contactsService.deleteContact() with the correct bookId and contact', function(done) {
        var self = this;

        this.contactsService.deleteContact = function(bookId, contact) {
          expect(bookId).to.equal(self.scope.bookId);
          expect(contact).to.deep.equal(self.scope.contact);
          done();
        };

        this.scope.$digest();
        this.scope.deleteContact();
        done(new Error());
      });

    });

  });

});
