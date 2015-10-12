'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  beforeEach(function() {
    module('ngRoute');
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });


  describe('The liveRefreshContactService service', function() {
    var liveNotificationMock, onFn, removeListenerFn;
    var $rootScope, liveRefreshContactService, CONTACT_SIO_EVENTS;
    var namespace = '/contacts';

    beforeEach(function() {
      onFn = sinon.spy();
      removeListenerFn = sinon.spy();
      liveNotificationMock = sinon.stub().returns({
        on: onFn,
        removeListener: removeListenerFn
      });

      module(function($provide) {
        $provide.value('livenotification', liveNotificationMock);
      });

      inject(function(_$rootScope_, _liveRefreshContactService_, _CONTACT_SIO_EVENTS_) {
        $rootScope = _$rootScope_;
        liveRefreshContactService = _liveRefreshContactService_;
        CONTACT_SIO_EVENTS = _CONTACT_SIO_EVENTS_;
      });

    });

    describe('The startListen fn', function() {

      it('should be called when user switches to contact module', function() {
        $rootScope.$broadcast('$routeChangeSuccess', {
          originalPath: '/contact',
          locals: { user: { _id: 1 } }
        });
        expect(onFn.callCount).to.equal(3);
      });

      it('should subscribe /contacts namespace with bookId', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(liveNotificationMock.calledOnce).to.be.true;
        expect(liveNotificationMock.calledWithExactly(namespace, bookId)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.CREATED event', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(onFn.firstCall.calledWith(CONTACT_SIO_EVENTS.CREATED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.DELETED event', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(onFn.secondCall.calledWith(CONTACT_SIO_EVENTS.DELETED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.UPDATED event', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);
        expect(onFn.thirdCall.calledWith(CONTACT_SIO_EVENTS.UPDATED)).to.be.true;
      });

    });

    describe('The stopListen fn', function() {

      it('should be call when user switches to outside contact module', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        $rootScope.$broadcast('$routeChangeSuccess', {
          originalPath: '/other/module/path'
        });

        expect(removeListenerFn.callCount).to.equal(3);
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.CREATED event listener', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        liveRefreshContactService.stopListen();
        expect(removeListenerFn.firstCall.calledWith(CONTACT_SIO_EVENTS.CREATED)).to.be.true;
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.DELETED event listener', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        liveRefreshContactService.stopListen();
        expect(removeListenerFn.secondCall.calledWith(CONTACT_SIO_EVENTS.DELETED)).to.be.true;
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.UPDATED event listener', function() {
        var bookId = 'some book id';
        liveRefreshContactService.startListen(bookId);

        liveRefreshContactService.stopListen();
        expect(removeListenerFn.thirdCall.calledWith(CONTACT_SIO_EVENTS.UPDATED)).to.be.true;
      });

    });

  });

  describe('The contactsCacheService service', function() {
    var contactsCacheService, CONTACT_EVENTS;
    var $rootScope;

    function injectService() {
      inject(function($injector, _$rootScope_, _CONTACT_EVENTS_) {
        $rootScope = _$rootScope_;
        contactsCacheService = $injector.get('contactsCacheService');
        CONTACT_EVENTS = _CONTACT_EVENTS_;
      });
    }

    it('should create cache at initialization', function() {
      injectService();
      expect(contactsCacheService.get()).to.deep.equal([]);
      expect(contactsCacheService.getMetadata()).to.deep.equal({});
    });

    describe('The put/get functions', function() {

      it('should not save undefined contacts', function() {
        injectService();
        contactsCacheService.put();
        expect(contactsCacheService.get()).to.deep.equal([]);
      });

      it('should cache save the contacts', function() {
        var contacts = [{id: 1}, {id: 2}];
        injectService();
        contactsCacheService.put(contacts);
        expect(contactsCacheService.get()).to.deep.equal(contacts);
      });

      it('should replace contacts when defined', function() {
        var contacts1 = [{id: 1}, {id: 2}];
        var contacts2 = [{id: 3}, {id: 4}];
        injectService();

        contactsCacheService.put(contacts1);
        contactsCacheService.put(contacts2);
        expect(contactsCacheService.get()).to.deep.equal(contacts2);
      });

      it('should not replace contacts when undefined', function() {
        var contacts = [{id: 1}, {id: 2}];
        injectService();

        contactsCacheService.put(contacts);
        contactsCacheService.put();
        expect(contactsCacheService.get()).to.deep.equal(contacts);
      });
    });

    describe('The push/get functions', function() {

      it('should add contacts to the cache', function() {
        var contacts = [{id: 1}, {id: 2}];
        injectService();

        contactsCacheService.push(contacts);
        expect(contactsCacheService.get().length).to.equal(2);
        expect(contactsCacheService.get()).to.shallowDeepEqual(contacts);
      });

      it('should append contacts to the cache', function() {
        var contacts = [{id: 1}, {id: 2}];
        var contact = {id: 3};
        injectService();

        contactsCacheService.put(contacts);
        contactsCacheService.push([contact]);
        expect(contactsCacheService.get().length).to.equal(3);
        contacts.concat(contact);
        expect(contactsCacheService.get()).to.shallowDeepEqual(contacts);
      });

      it('should not add undefined', function() {
        var contacts = [{id: 1}, {id: 2}];
        injectService();

        contactsCacheService.put(contacts);
        contactsCacheService.push();
        expect(contactsCacheService.get().length).to.equal(2);
        expect(contactsCacheService.get()).to.deep.equal(contacts);
      });
    });

    describe('The setMetadata/getMetadata functions', function() {
      it('should not add undefined key and value', function() {
        injectService();

        contactsCacheService.setMetadata();
        expect(contactsCacheService.getMetadata()).to.deep.equal({});
      });

      it('should not add when null key', function() {
        injectService();
        contactsCacheService.setMetadata(null, 'yolo');
        expect(contactsCacheService.getMetadata()).to.deep.equal({});
      });

      it('should save input data', function() {
        var key = 'foo';
        var value = 'bar';

        injectService();
        contactsCacheService.setMetadata(key, value);
        var result = {};
        result[key] = value;
        expect(contactsCacheService.getMetadata()).to.deep.equal(result);
      });

      it('should override input data', function() {
        var key = 'foo';
        var value1 = 'bar';
        var value2 = 'baz';

        injectService();
        contactsCacheService.setMetadata(key, value1);
        contactsCacheService.setMetadata(key, value2);
        var result = {};
        result[key] = value2;
        expect(contactsCacheService.getMetadata()).to.deep.equal(result);
      });
    });

    it('should clear cache when user goes to outside contact module', function() {
      injectService();

      contactsCacheService.put([123]);
      var nextRoute = {
        originalPath: '/some/other/path'
      };
      var currentRoute = {
        originalPath: '/contact'
      };

      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.not.be.defined;

      contactsCacheService.put([123]);
      nextRoute.originalPath = '/contactAbc';
      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.not.be.defined;
    });

    it('should clear cache on page redirect (/ goes to /communities)', function() {
      injectService();

      contactsCacheService.put([123]);
      var nextRoute = {
      };
      var currentRoute = {
        originalPath: '/contact'
      };

      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.not.be.defined;

      contactsCacheService.put([123]);
      nextRoute.originalPath = '/contactAbc';
      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.not.be.defined;
    });

    it('should not clear cache when user is still contact module', function() {
      injectService();
      contactsCacheService.put([123]);
      var nextRoute = {
        originalPath: '/contact/path'
      };
      var currentRoute = {
        originalPath: '/contact'
      };
      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.eql([123]);

      currentRoute.originalPath = '/contact/path';
      nextRoute.originalPath = '/contact';
      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.eql([123]);
    });

    it('should not clear cache when user is not in contact module', function() {
      injectService();
      contactsCacheService.put([123]);
      var currentRoute = {
        originalPath: '/currentroute/path'
      };
      var nextRoute = {
        originalPath: '/nextroute/path'
      };

      $rootScope.$emit('$routeChangeStart', nextRoute, currentRoute);
      expect(contactsCacheService.get()).to.eql([123]);
    });

    it('should add contact to cache on CONTACT_EVENTS.CREATED event', function() {
      injectService();
      var contact1 = { id: 1, firstName: '1' };
      var contact2 = { id: 2, firstName: '2' };
      contactsCacheService.put([contact1]);
      $rootScope.$emit(CONTACT_EVENTS.CREATED, contact2);
      expect(contactsCacheService.get()).to.eql([contact1, contact2]);
    });

    it('should not add duplicated contacts to cache on CONTACT_EVENTS.CREATED event', function() {
      injectService();
      var contact1 = { id: 1, firstName: '1' };
      var contact2 = { id: 2, firstName: '2' };
      contactsCacheService.put([contact1, contact2]);
      $rootScope.$emit(CONTACT_EVENTS.CREATED, contact2);
      expect(contactsCacheService.get()).to.eql([contact1, contact2]);
    });

    it('should update contact on CONTACT_EVENTS.UPDATED event', function() {
      injectService();

      var oldContact = {
        id: 123,
        name: 'old name'
      };
      var newContact = {
        id: 123,
        name: 'new name'
      };
      contactsCacheService.put([oldContact]);
      $rootScope.$emit(CONTACT_EVENTS.UPDATED, newContact);
      expect(contactsCacheService.get()).to.eql([newContact]);
    });

    it('should call forceReloadDefaultAvatar fn to reload default avatar on CONTACT_EVENTS.UPDATED event', function(done) {
      module(function($provide) {
        $provide.value('ContactsHelper', {
          forceReloadDefaultAvatar: function(contact) {
            expect(contact).to.eql(newContact);
            done();
          }
        });
      });

      injectService();

      var oldContact = {
        id: 123,
        name: 'old name'
      };
      var newContact = {
        id: 123,
        name: 'new name'
      };

      contactsCacheService.put([oldContact]);
      $rootScope.$emit(CONTACT_EVENTS.UPDATED, newContact);
    });

    it('should delete contact on CONTACT_EVENTS.DELETED event', function() {
      injectService();

      var contact1 = {
        id: 123,
        name: '123'
      };
      var contact2 = {
        id: 456,
        name: '456'
      };
      contactsCacheService.put([contact1, contact2]);
      $rootScope.$emit(CONTACT_EVENTS.DELETED, contact2);
      expect(contactsCacheService.get()).to.eql([contact1]);
    });

    it('should add contact again on CONTACT_EVENTS.CANCEL_DELETE event', function() {
      injectService();

      var contact1 = {
        id: 123,
        name: '123'
      };
      var contact2 = {
        id: 456,
        name: '456'
      };
      var contact3 = {
        id: 789,
        name: '789'
      };
      contactsCacheService.put([contact1, contact2]);
      $rootScope.$emit(CONTACT_EVENTS.CANCEL_DELETE, contact3);
      expect(contactsCacheService.get()).to.eql([contact1, contact2, contact3]);
    });

  });

  describe('The contactsService service', function() {
    var ICAL, CONTACT_EVENTS, contact, contactWithChangedETag, contactAsJCard;

    beforeEach(function() {
      var self = this;
      this.uuid4 = {
        // This is a valid uuid4. Change this if you need other uuids generated.
        _uuid: '00000000-0000-4000-a000-000000000000',
        generate: function() {
          return this._uuid;
        }
      };
      this.notificationFactory = {};
      this.gracePeriodService = {};
      this.gracePeriodLiveNotification = {};

      contact = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last'};
      contactWithChangedETag = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last', etag: 'changed-etag' };
      contactAsJCard = ['vcard', [
        ['uid', {}, 'text', '00000000-0000-4000-a000-000000000000'],
        ['n', {}, 'text', ['Last', '', '', '', '']]
      ], []];

      angular.mock.module(function($provide) {
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('uuid4', self.uuid4);
        $provide.value('gracePeriodService', self.gracePeriodService);
        $provide.value('gracePeriodLiveNotification', self.gracePeriodLiveNotification);
      });
    });

    beforeEach(angular.mock.inject(function(contactsService, contactsCacheService, $httpBackend, $rootScope, $q, _ICAL_, DAV_PATH, GRACE_DELAY, _CONTACT_EVENTS_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.contactsService = contactsService;
      this.contactsCacheService = contactsCacheService;
      this.DAV_PATH = DAV_PATH;
      this.GRACE_DELAY = GRACE_DELAY;

      this.getExpectedPath = function(path) {
        return this.DAV_PATH + path;
      };

      ICAL = _ICAL_;
      CONTACT_EVENTS = _CONTACT_EVENTS_;
    }));

    describe('The list fn', function() {
      var bookId = '5375de4bd684db7f6fbd4f97';
      var userId = '123456789';
      var uid = 'myuid';
      var contactsURL = '/addressbooks/' + bookId + '/contacts.json';
      var result;

      beforeEach(function() {
        result = {
          _links: {
            self: {
              href: contactsURL
            }
          },
          'dav:syncToken': 6,
          '_embedded': {
            'dav:item': [
              {
                '_links': {
                  'self': '/addressbooks/5375de4bd684db7f6fbd4f97/contacts/myuid.vcf'
                },
                'etag': '\'6464fc058586fff85e3522de255c3e9f\'',
                'data': [
                  'vcard',
                  [
                    ['version', {}, 'text', '4.0'],
                    ['uid', {}, 'text', uid],
                    ['n', {}, 'text', ['Burce', 'Willis', '', '', '']]
                  ]
                ]
              }
            ]
          }
        };
      });

      function setNextPage() {
        result._links.next = {href: '/next'};
      }

      describe('Without cache option', function() {
        it('should list cards', function(done) {

          this.$httpBackend.expectGET(this.getExpectedPath(contactsURL)).respond(result);

          this.contactsService.list(bookId).then(function(data) {
            var cards = data.contacts;
            expect(cards).to.be.an.array;
            expect(cards.length).to.equal(1);
            expect(cards[0].id).to.equal(uid);
            expect(cards[0].vcard).to.be.an('object');
            expect(cards[0].etag).to.be.empty;
          }.bind(this)).finally (done);

          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });
      });

      describe('With cache option', function() {
        var options = {cache: true};

        function checkResult(done) {
          return function(data) {
            expect(data.contacts).to.be.an.array;
            expect(data.contacts.length).to.equal(1);
            expect(data.contacts[0].id).to.equal(uid);
            expect(data.cache).to.be.false;
            expect(data.current_page).to.eql(options.page);
            done();
          };
        }

        beforeEach(function() {
          this.contactsCacheService.put([]);
        });

        it('should return the cached contacts when getting contacts from lower page', function(done) {
          var contacts = [123, 456];
          var cachedPage = 2;
          options.paginate = true;
          options.page = 1;
          this.contactsCacheService.setMetadata('page', cachedPage);
          this.contactsCacheService.put(contacts);

          this.contactsService.list(bookId, userId, options).then(function(data) {
            expect(data.contacts).to.eql([123, 456]);
            expect(data.cache).to.be.true;
            expect(data.current_page).to.eql(options.page);
            expect(data.next_page).to.equal(cachedPage + 1);
            done();
          });
          this.$rootScope.$apply();
        });

        it('should return the cached contacts when getting contacts from same page', function(done) {
          var contacts = [123, 456];
          var cachedPage = 2;
          options.paginate = true;
          options.page = cachedPage;
          this.contactsCacheService.setMetadata('page', cachedPage);
          this.contactsCacheService.put(contacts);

          this.contactsService.list(bookId, userId, options).then(function(data) {
            expect(data.contacts).to.eql([123, 456]);
            expect(data.cache).to.be.true;
            expect(data.current_page).to.eql(options.page);
            expect(data.next_page).to.equal(cachedPage + 1);
            done();
          });
          this.$rootScope.$apply();
        });

        it('should not return next_page when cache is last_page', function(done) {
          var contacts = [123, 456];
          var cachedPage = 2;
          options.paginate = true;
          options.page = 1;
          this.contactsCacheService.setMetadata('page', cachedPage);
          this.contactsCacheService.setMetadata('last_page', true);
          this.contactsCacheService.put(contacts);

          this.contactsService.list(bookId, userId, options).then(function(data) {
            expect(data.next_page).to.not.be.defined;
            done();
          });
          this.$rootScope.$apply();
        });

        it('should call the backend when cache does not contains all the pages', function(done) {
          var contacts = [123, 456];
          options.paginate = true;
          options.page = 3;
          this.contactsCacheService.setMetadata('page', 2);
          this.contactsCacheService.put(contacts);
          var url = this.getExpectedPath(contactsURL) + '?limit=20&offset=40&sort=fn&userId=' + userId;
          this.$httpBackend.expectGET(url).respond(result);
          this.contactsService.list(bookId, userId, options).then(checkResult(done));
          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });

        it('should call the backend when cache is empty', function(done) {
          var page = 1;
          options.paginate = true;
          options.page = page;
          setNextPage();
          var url = this.getExpectedPath(contactsURL) + '?limit=20&offset=0&sort=fn&userId=' + userId;
          this.$httpBackend.expectGET(url).respond(result);
          this.contactsService.list(bookId, userId, options).then(function(data) {
            checkResult(function() {
              expect(data.next_page).to.equal(page + 1);
              done();
            })(data);
          });
          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });

        it('should call the backend when cache contacts array is empty', function(done) {
          var page = 1;
          this.contactsCacheService.put([]);
          options.paginate = true;
          options.page = page;
          setNextPage();
          var url = this.getExpectedPath(contactsURL) + '?limit=20&offset=0&sort=fn&userId=' + userId;
          this.$httpBackend.expectGET(url).respond(result);
          this.contactsService.list(bookId, userId, options).then(function(data) {
            checkResult(function() {
              expect(data.next_page).to.equal(page + 1);
              done();
            })(data);
          });
          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });

        it('should call the backend when cache is empty and do not set next_page if last page is reached', function(done) {
          var page = 1;
          options.paginate = true;
          options.page = page;
          var url = this.getExpectedPath(contactsURL) + '?limit=20&offset=0&sort=fn&userId=' + userId;
          this.$httpBackend.expectGET(url).respond(result);
          this.contactsService.list(bookId, userId, options).then(function(data) {
            checkResult(function() {
              expect(data.next_page).to.not.be.defined;
              done();
            })(data);
          });
          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });

        it('should call the backend with right parameters, add the result to cache and return result', function(done) {
          var self = this;
          options.paginate = true;
          options.page = 1;
          var url = this.getExpectedPath(contactsURL) + '?limit=20&offset=0&sort=fn&userId=' + userId;
          this.$httpBackend.expectGET(url).respond(result);
          this.contactsService.list(bookId, userId, options).then(checkResult(function() {
            expect(self.contactsCacheService.get().length).to.equal(1);
            expect(self.contactsCacheService.get()[0].id).to.equal(uid);
            expect(self.contactsCacheService.getMetadata().page).to.equal(options.page);
            done();
          }));
          this.$rootScope.$apply();
          this.$httpBackend.flush();
        });
      });

    });

    describe('The getCard fn', function() {

      it('should return a contact', function(done) {

        // The caldav server will be hit
        this.$httpBackend.expectGET(this.getExpectedPath('/addressbooks/1/contacts/2.vcf')).respond(
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid'],
            ['fn', {}, 'text', 'first last'],
            ['n', {}, 'text', ['last', 'first']],
            ['email', { type: 'Work' }, 'text', 'mailto:foo@example.com'],
            ['tel', { type: 'Work' }, 'uri', 'tel:123123'],
            ['adr', { type: 'Home' }, 'text', ['', '', 's', 'c', '', 'z', 'co']],
            ['org', {}, 'text', 'org'],
            ['url', { type: 'Work' }, 'uri', 'http://linagora.com'],
            ['role', {}, 'text', 'role'],
            ['socialprofile', { type: 'Twitter' }, 'text', '@AwesomePaaS'],
            ['categories', {}, 'text', 'starred', 'asdf'],
            ['bday', {}, 'date', '2015-01-01'],
            ['nickname', {}, 'text', 'nick'],
            ['note', {}, 'text', 'notes'],
            ['photo', {}, 'text', 'data:image/png;base64,iVBOR=']
          ], []],
          // headers:
          { 'ETag': 'testing-tag' }
        );

        this.contactsService.getCard(1, 2).then(function(contact) {
          expect(contact).to.be.an('object');
          expect(contact.id).to.equal('myuid');

          expect(contact.vcard).to.be.an('object');
          expect(contact.etag).to.equal('testing-tag');

          expect(contact.firstName).to.equal('first');
          expect(contact.lastName).to.equal('last');
          expect(contact.displayName).to.equal('first last');
          expect(contact.emails).to.deep.equal([{type: 'Work', value: 'foo@example.com'}]);
          expect(contact.addresses).to.deep.equal([{
            type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co'
          }]);
          expect(contact.org).to.equal('org');
          expect(contact.orgUri).to.equal('http://linagora.com');
          expect(contact.orgRole).to.equal('role');
          expect(contact.social).to.deep.equal([{ type: 'Twitter', value: '@AwesomePaaS' }]);
          expect(contact.tags).to.deep.equal([{ text: 'asdf' }]);
          expect(contact.starred).to.be.true;
          expect(contact.birthday).to.equalDate(new Date(2015, 0, 1));
          expect(contact.nickname).to.equal('nick');
          expect(contact.notes).to.equal('notes');
          expect(contact.photo).to.equal('data:image/png;base64,iVBOR=');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should return a contact with no photo if not defined in vCard', function(done) {
        this.$httpBackend.expectGET(this.getExpectedPath('/addressbooks/1/contacts/2.vcf')).respond(
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []]
        );

        this.contactsService.getCard(1, 2).then(function(contact) {
          expect(contact.photo).to.not.exist;
        }.bind(this)).finally (done);

        this.$httpBackend.flush();
      });

      it('should have contact with default avatar forced reload', function(done) {
        this.$httpBackend.expectGET(this.getExpectedPath('/addressbooks/1/contacts/2.vcf')).respond(
          ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', 'myuid'],
              ['photo', {}, 'uri', 'http://abc.com/contact/api/contacts/123/456/avatar']
            ]
          ]
        );

        this.contactsService.getCard(1, 2).then(function(contact) {
          expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
          done();
        });

        this.$httpBackend.flush();
      });

      it('should return a contact with a string birthday if birthday is not a date', function(done) {
        this.$httpBackend.expectGET(this.getExpectedPath('/addressbooks/1/contacts/2.vcf')).respond(
          ['vcard', [
            ['bday', {}, 'text', 'a text birthday']
          ], []],
          { 'ETag': 'testing-tag' }
        );

        this.contactsService.getCard(1, 2).then(function(contact) {
          expect(contact.birthday).to.equal('a text birthday');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

    });

    describe('The create fn', function() {

      it('should fail on 500 response status', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(500, '');

        this.contactsService.create(1, contact).then(null, function(response) {
            expect(response.status).to.equal(500);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should fail on a 2xx status that is not 201', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(200, '');

        this.contactsService.create(1, contact).then(null, function(response) {
            expect(response.status).to.equal(200);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed when everything is correct', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(201);
        this.$httpBackend.expectGET(this.getExpectedPath(requestPath)).respond(201,
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []]
        );

        this.contactsService.create(1, contact).then(
          function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should emit CONTACT_EVENTS.CREATED event with created contact when success', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(201);

        this.$httpBackend.expectGET(this.getExpectedPath(requestPath)).respond(201,
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []]
        );

        this.$rootScope.$on(CONTACT_EVENTS.CREATED, function(e, contact) {
          expect(contact.id).to.equal('myuid');
          done();
        });

        var spy = sinon.spy(this.$rootScope, '$emit');
        this.contactsService.create(1, contact).then(function() {
          expect(spy.withArgs(CONTACT_EVENTS.CREATED).calledOnce).to.be.true;
        });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The modify fn', function() {

      beforeEach(function() {
        var vcard = new ICAL.Component('vcard');
        vcard.addPropertyWithValue('version', '4.0');
        vcard.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcard.addPropertyWithValue('fn', 'test card');
        this.vcard = vcard;
      });

      it('should fail if status is 201', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=8000')).respond(201);

        this.contactsService.modify(1, contact).then(null, function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 202', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=8000')).respond(202, '', { 'X-ESN-TASK-ID': 'taskId' });

        this.contactsService.modify(1, contact).then(
          function(taskId) {
            expect(taskId).to.equal('taskId');
            done();
          });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=8000')).respond(204, '', { 'X-ESN-TASK-ID': 'taskId' });

        this.contactsService.modify(1, contact).then(
          function(taskId) {
            expect(taskId).to.equal('taskId');
            done();
          });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should send etag as If-Match header', function(done) {
        var requestHeaders = {
          'Content-Type': 'application/vcard+json',
          'Prefer': 'return-representation',
          'If-Match': 'etag',
          'Accept': 'application/json, text/plain, */*'
        };

        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=8000'), function() { return true; }, requestHeaders).respond(202);

        contact.etag = 'etag';
        this.contactsService.modify(1, contact).then(function() { done(); });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should emit CONTACT_EVENTS.UPDATED event with updated contact on 202', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=8000';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(202);

        var spy = sinon.spy(this.$rootScope, '$emit');
        this.$rootScope.$on(CONTACT_EVENTS.UPDATED, function(e, updatedContact) {
          expect(updatedContact).to.eql(contact);
          expect(spy.calledOnce).to.be.true;
          done();
        });

        this.contactsService.modify(1, contact);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should emit CONTACT_EVENTS.UPDATED event with updated contact on 204', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=8000';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(204);

        var spy = sinon.spy(this.$rootScope, '$emit');
        this.$rootScope.$on(CONTACT_EVENTS.UPDATED, function(e, updatedContact) {
          expect(updatedContact).to.eql(contact);
          expect(spy.calledOnce).to.be.true;
          done();
        });

        this.contactsService.modify(1, contact);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

    });

    describe('The shellToVCARD fn', function() {
      function compareShell(contactsService, shell, ical) {
        var vcard = contactsService.shellToVCARD(shell);
        var properties = vcard.getAllProperties();
        var propkeys = properties.map(function(p) {
          return p.name;
        }).sort();
        var icalkeys = Object.keys(ical).sort();

        var message = 'Key count mismatch in ical object.\n' +
                      'expected: ' + icalkeys + '\n' +
                      '   found: ' + propkeys;
        expect(properties.length).to.equal(icalkeys.length, message);

        for (var propName in ical) {
          var prop = vcard.getFirstProperty(propName);
          expect(prop, 'Missing: ' + propName).to.be.ok;
          var value = prop.toICAL();
          expect(value).to.equal(ical[propName].toString());
        }
      }

      it('should correctly create a card with display name', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          displayName: 'display name'
        };
        var ical = {
          version: 'VERSION:4.0',
          uid: 'UID:00000000-0000-4000-a000-000000000000',
          fn: 'FN:display name'
        };

        compareShell(this.contactsService, shell, ical);
      });

      it('should correctly create a card with first/last name', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          lastName: 'last',
          firstName: 'first'
        };
        var ical = {
          version: 'VERSION:4.0',
          uid: 'UID:00000000-0000-4000-a000-000000000000',
          fn: 'FN:first last',
          n: 'N:last;first'
        };

        compareShell(this.contactsService, shell, ical);
      });

      it('should correctly create a card with all props', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          lastName: 'last',
          firstName: 'first',
          starred: true,
          tags: [{ text: 'a' }, { text: 'b'}],
          emails: [{ type: 'Home', value: 'email@example.com' }],
          tel: [{ type: 'Home', value: '123123' }],
          addresses: [{ type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co' }],
          social: [{ type: 'Twitter', value: '@AwesomePaaS' }],
          org: 'org',
          orgRole: 'role',
          orgUri: 'orgUri',
          birthday: new Date(2015, 0, 1),
          nickname: 'nick',
          notes: 'notes',
          photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
        };
        var ical = {
          version: 'VERSION:4.0',
          uid: 'UID:00000000-0000-4000-a000-000000000000',
          fn: 'FN:first last',
          n: 'N:last;first',
          email: 'EMAIL;TYPE=Home:mailto:email@example.com',
          adr: 'ADR;TYPE=Home:;;s;c;;z;co',
          tel: 'TEL;TYPE=Home:tel:123123',
          org: 'ORG:org',
          url: 'URL;TYPE=Work:http://orgUri',
          role: 'ROLE:role',
          socialprofile: 'SOCIALPROFILE;TYPE=Twitter:@AwesomePaaS',
          categories: 'CATEGORIES:a,b,starred',
          bday: 'BDAY;VALUE=DATE:20150101',
          nickname: 'NICKNAME:nick',
          note: 'NOTE:notes',
          photo: 'PHOTO:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
        };

        compareShell(this.contactsService, shell, ical);
      });

      it('should correctly create a card when birthday is not a Date', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          birthday: 'not sure about the birthday'
        };
        var ical = {
          version: 'VERSION:4.0',
          uid: 'UID:00000000-0000-4000-a000-000000000000',
          fn: 'FN:not sure about the birthday',
          bday: 'BDAY;VALUE=TEXT:not sure about the birthday'
        };

        compareShell(this.contactsService, shell, ical);
      });
    });


    describe('The remove fn', function() {

      it('should pass the graceperiod as a query parameter if defined', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=1234')).respond(204);

        this.contactsService.remove(1, contact, 1234).then(function() { done(); });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should broadcast CONTACT_EVENTS.DELETED on success', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(204);

        this.$rootScope.$on(CONTACT_EVENTS.DELETED, function(e, data) {
          expect(data).to.deep.equal(contact);

          done();
        });

        this.contactsService.remove(1, contact);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should fail on a status that is not 204 and not 202', function(done) {

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(201);

        this.contactsService.remove(1, contact).then(null, function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed when response.status is 204', function(done) {

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(204);

        this.contactsService.remove(1, contact).then(
          function() {
            done();
          }
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed when response.status is 202', function(done) {

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(202);

        this.contactsService.remove(1, contact).then(
          function() {
            done();
          }
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should send etag as If-Match header', function(done) {
        var requestHeaders = {
          'If-Match': 'etag',
          'Accept': 'application/json, text/plain, */*'
        };

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf'), requestHeaders).respond(204);

        contact.etag = 'etag';
        this.contactsService.remove(1, contact).then(function() { done(); });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should resolve to the pending task identifier', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(202, null, { 'X-ESN-Task-Id': '1234' });

        this.contactsService.remove(1, contact).then(
          function(id) {
            expect(id).to.equal('1234');

            done();
          }
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should resolve to nothing on direct deletion', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(204);

        this.contactsService.remove(1, contact).then(
          function(response) {
            expect(response).to.not.exist;

            done();
          }
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

    });


    describe('The deleteContact fn', function() {

      beforeEach(function() {
        this.notificationFactory.weakInfo = function() {};
        this.notificationFactory.weakError = function() {};
        this.gracePeriodLiveNotification.registerListeners = function() {};
      });

      it('should display correct title and link during the grace period', function(done) {
        this.gracePeriodService.grace = function(taskId, text, linkText, delay) {
          expect(taskId).to.equals('myTaskId');
          expect(text).to.equals('You have just deleted a contact (Foo Bar).');
          expect(linkText).to.equals('Cancel');
          expect(delay).to.not.exist;
          done();
        };

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=' + this.GRACE_DELAY))
          .respond(function(method, url, data, headers) {
            return [204, '', {'X-ESN-TASK-ID' : 'myTaskId'}];
          });
        contact.displayName = 'Foo Bar';
        this.contactsService.deleteContact('1', contact);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should display error when on remove failure', function(done) {
        this.notificationFactory.weakError = function() {
          done();
        };

        // make the remove failure by passing undefined contact ID
        this.contactsService.deleteContact('1', { firstName: 'I have no id' });
        this.$rootScope.$apply();
        done(new Error());
      });

      it('should not grace the request on failure', function() {
        this.gracePeriodService.grace = sinon.spy();

        // make the remove failure by passing undefined contact ID
        this.contactsService.deleteContact('1', { firstName: 'I have no id' });
        this.$rootScope.$apply();

        expect(this.gracePeriodService.grace.callCount).to.equal(0);
      });

      it('should grace the request using the default delay on success', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=' + this.GRACE_DELAY))
          .respond(function(method, url, data, headers) {
            return [204, '', {'X-ESN-TASK-ID' : 'myTaskId'}];
          });

        this.gracePeriodService.grace = function(taskId, text, linkText, delay) {
          expect(delay).to.not.exist;
          done();
        };

        this.contactsService.deleteContact('1', contact);
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should register grace live notification on success', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=' + this.GRACE_DELAY))
          .respond(function(method, url, data, headers) {
            return [204, '', {'X-ESN-TASK-ID' : 'myTaskId'}];
          });

        this.notificationFactory.strongError = sinon.spy();
        var onCancelDeleteSpy = sinon.spy();
        this.$rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, onCancelDeleteSpy);

        var self = this;

        this.gracePeriodLiveNotification.registerListeners = function(taskId, onError) {
          expect(taskId).to.equal('myTaskId');
          onError();
          expect(self.notificationFactory.strongError.callCount).to.equal(1);
          expect(onCancelDeleteSpy.callCount).to.equal(1);
          done();
        };

        this.contactsService.deleteContact('1', contact);
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should cancel the request if the user cancels during the grace period', function(done) {
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: true,
            success: function() {},
            error: function() {}
          });
        };

        this.gracePeriodService.cancel = function(taskId) {
          expect(taskId).to.equal('myTaskId');
          done();
        };

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=' + this.GRACE_DELAY))
          .respond(function(method, url, data, headers) {
            return [204, '', {'X-ESN-TASK-ID' : 'myTaskId'}];
          });

        this.contactsService.deleteContact('1', contact);
        this.$rootScope.$apply();
        this.$httpBackend.flush();

      });

      it('should notify the user that the contact deletion cannot be cancelled', function(done) {
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: true,
            success: function() {},
            error: function() { done(); }
          });
        };

        this.gracePeriodService.cancel = function(taskId) {
          expect(taskId).to.equal('myTaskId');
          return $q.reject();
        };

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=' + this.GRACE_DELAY))
          .respond(function(method, url, data, headers) {
            return [204, '', {'X-ESN-TASK-ID' : 'myTaskId'}];
          });

        this.contactsService.deleteContact('1', contact);
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should broadcast CONTACT_EVENTS.CANCEL_DELETE on successful cancellation of a request', function(done) {
        this.gracePeriodService.grace = function() {
          return $q.when({
            cancelled: true,
            success: function() {},
            error: function(textToDisplay) {}
          });
        };
        this.gracePeriodService.cancel = function() {
          return $q.when();
        };

        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=' + this.GRACE_DELAY))
          .respond(function(method, url, data, headers) {
            return [204, '', {'X-ESN-TASK-ID' : 'myTaskId'}];
          });

        this.$rootScope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(evt, data) {
          expect(data).to.eql(contact);
          done();
        });

        this.contactsService.deleteContact('1', contact);
        this.$rootScope.$apply();
        this.$httpBackend.flush();

      });

    });

  });


  describe('The ContactsHelper service', function() {

    beforeEach(angular.mock.inject(function(ContactsHelper, $rootScope, _ICAL_) {
      this.$rootScope = $rootScope;
      this.contactHelper = ContactsHelper;
      this.ICAL = _ICAL_;
    }));

    describe('The getFormattedAddress function', function() {

      beforeEach(function() {
        this.expectEqual = function(value) {
          expect(this.contactHelper.getFormattedAddress(this.address)).to.equal(value);
        };
      });

      it('should return empty string when address is undefined', function() {
        expect(this.contactHelper.getFormattedAddress(this.address)).to.equal('');
      });

      it('should return street when address.street is only defined', function() {
        var street = 'My street';
        this.address = {street: street};
        this.expectEqual(street);
      });

      it('should return city when address.city is only defined', function() {
        var city = 'My city';
        this.address = {city: city};
        this.expectEqual(city);
      });

      it('should return zip when address.zip is only defined', function() {
        var zip = 'My zip';
        this.address = {zip: zip};
        this.expectEqual(zip);
      });

      it('should return country when address.country is only defined', function() {
        var country = 'My country';
        this.address = {country: country};
        this.expectEqual(country);
      });

      it('should return full string address when address is defined', function() {
        var street = 'My street';
        var city = 'My city';
        var zip = 'My zip';
        var country = 'My country';
        this.address = {street: street, city: city, zip: zip, country: country};
        this.expectEqual(street + ' ' + city + ' ' + zip + ' ' + country);
      });

    });

    describe('The getFormattedName function', function() {

      beforeEach(function() {

        this.homeEmail = { type: 'Home', value: 'home@example.com' };
        this.workEmail = { type: 'Work', value: 'work@example.com' };
        this.otherEmail = { type: 'Other', value: 'other@example.com' };

        this.twitter = { type: 'Twitter', value: '@AwesomePaaS' };
        this.google = { type: 'Google', value: '+AwesomePaaS' };
        this.linkedin = { type: 'Linkedin', value: 'AwesomePaaS.in' };
        this.fb = { type: 'Facebook', value: 'AwesomePaaS.fb' };
        this.skype = { type: 'Skype', value: 'AwesomePaaS.skype' };
        this.otherSocial = { type: 'Instagram', value: 'AwesomePaaS.instagram' };

        this.homeTel = { type: 'Home', value: '+11111111' };
        this.mobileTel = { type: 'Mobile', value: '+22222222' };
        this.workTel = { type: 'Work', value: '+33333333' };
        this.otherTel = { type: 'Other', value: '+44444444' };

      });

      beforeEach(function() {
        this.shell = {
          starred: true,
          tags: [],
          emails: [],
          tel: [],
          addresses: [],
          social: [],
          org: '',
          orgRole: 'role',
          orgUri: 'orgUri',
          nickname: '',
          notes: '',
          photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
        };

        this.expectEqual = function(value) {
          expect(this.contactHelper.getFormattedName(this.shell)).to.equal(value);
        };

        this.expectNotEqual = function(value) {
          expect(this.contactHelper.getFormattedName(this.shell)).to.not.equal(value);
        };

        this.expectUndefined = function() {
          expect(this.contactHelper.getFormattedName(this.shell)).to.be.undefined;
        };
      });

      it('should return firstName + _ + lastName when both defined', function() {
        this.shell.firstName = 'Foo';
        this.shell.lastName = 'Bar';
        this.expectEqual(this.shell.firstName + ' ' + this.shell.lastName);
      });

      it('should return firstname when firstname defined and lastname undefined', function() {
        this.shell.firstName = 'Foo';
        this.expectEqual(this.shell.firstName);
      });

      it('should return lastname when firstname undefined and lastname defined', function() {
        this.shell.lastName = 'Bar';
        this.expectEqual(this.shell.lastName);
      });

      it('should return org when when !firstName && !lastName && org', function() {
        this.shell.org = 'MyOrg';
        this.expectEqual(this.shell.org);
      });

      it('should return nickname when !firstName && !lastName && !org && nickname', function() {
        this.shell.nickname = 'FooBar';
        this.expectEqual(this.shell.nickname);
      });

      it('should return work email when defined', function() {
        this.shell.emails = [this.homeEmail, this.workEmail, this.otherEmail];
        this.expectEqual(this.workEmail.value);
      });

      it('should return home email when !work', function() {
        this.shell.emails = [this.homeEmail, this.otherEmail];
        this.expectEqual(this.homeEmail.value);
      });

      it('should return other email when !work && !home', function() {
        this.shell.emails = [this.otherEmail];
        this.expectEqual(this.otherEmail.value);
      });

      it('should return twitter account when defined', function() {
        this.shell.social = [this.twitter, this.google, this.linkedin, this.fb, this.skype];
        this.expectEqual(this.twitter.value);
      });

      it('should return skype account when defined', function() {
        this.shell.social = [this.google, this.linkedin, this.fb, this.skype];
        this.expectEqual(this.skype.value);
      });

      it('should return google account when defined', function() {
        this.shell.social = [this.linkedin, this.google, this.fb];
        this.expectEqual(this.google.value);
      });

      it('should return linkedin account when defined', function() {
        this.shell.social = [this.linkedin, this.fb];
        this.expectEqual(this.linkedin.value);
      });

      it('should return facebook account when defined', function() {
        this.shell.social = [this.fb, this.otherSocial];
        this.expectEqual(this.fb.value);
      });

      it('should return other social account when defined', function() {
        this.shell.social = [this.otherSocial];
        this.expectEqual(this.otherSocial.value);
      });

      it('should return work tel when defined', function() {
        this.shell.tel = [this.homeTel, this.workTel, this.mobileTel, this.otherTel];
        this.expectEqual(this.workTel.value);
      });

      it('should return mobile tel when defined', function() {
        this.shell.tel = [this.homeTel, this.mobileTel, this.otherTel];
        this.expectEqual(this.mobileTel.value);
      });

      it('should return home tel when defined', function() {
        this.shell.tel = [this.homeTel, this.otherTel];
        this.expectEqual(this.homeTel.value);
      });

      it('should return other tel when defined', function() {
        this.shell.tel = [this.otherTel];
        this.expectEqual(this.otherTel.value);
      });

      it('should return notes when defined', function() {
        this.shell.notes = 'This is a note';
        this.expectEqual(this.shell.notes);
      });

      it('should return first tag when defined', function() {
        var expected = 'A';
        this.shell.tags = [{text: expected}, {text: 'B'}];
        this.expectEqual(expected);
      });

      it('should not return first tag when empty', function() {
        this.shell.tags = [{text: ''}, {text: 'B'}];
        this.expectNotEqual('');
      });

      it('should return formatted birthday if defined and a Date', function() {
        this.shell.birthday = new Date(1942, 0, 1);
        this.expectEqual('01/01/1942');
      });

      it('should return birthday as-is if defined but not a Date', function() {
        this.shell.birthday = 'I am not a date';
        this.expectEqual('I am not a date');
      });

      it('should return formatted address when address is defined', function() {
        this.shell.addresses = [{street: 'My street', zip: 'My zip', city: 'My city', country: 'My country'}];
        var result = this.contactHelper.getFormattedName(this.shell);
        expect(result).to.match(/My street/);
        expect(result).to.match(/My zip/);
        expect(result).to.match(/My city/);
        expect(result).to.match(/My country/);
      });

      it('should return undefined when no values', function() {
        this.shell = {};
        this.expectUndefined();
      });

      it('should return email before company', function() {
        this.shell.emails = [this.otherEmail];
        this.shell.org = 'MyOrg';
        this.expectEqual(this.otherEmail.value);
      });
    });

    describe('The forceReloadDefaultAvatar fn', function() {

      it('should append timestamp to default avatar url', function() {
        var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar' };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
      });

      it('should append timestamp parameter correctly', function() {
        var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar?x=1&y=2' };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?x=1&y=2&t=[0-10]+/);
      });

      it('should update timestamp parameter if exist', function() {
        var photoUrl = 'http://abc.com/contact/api/contacts/123/456/avatar?t=1';
        var contact = { photo: photoUrl };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
        expect(contact.photo).to.not.equal(photoUrl);
      });

      it('should not append timestamp to custom avatar url', function() {
        var avatarUrl = 'http://abc.com/this/is/my/cuties/avatar';
        var contact = { photo: avatarUrl };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.equal(avatarUrl);
      });

      it('should upate the photo value in vcard', function() {
        var vcard = new this.ICAL.Component(['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid'],
            ['photo', {}, 'uri', 'http://abc.com/contact/api/contacts/123/456/avatar']
        ]]);
        var contact = { photo: 'http://abc.com/contact/api/contacts/123/456/avatar', vcard: vcard };
        this.contactHelper.forceReloadDefaultAvatar(contact);
        expect(contact.photo).to.match(/123\/456\/avatar\?t=[0-10]+/);
        expect(contact.vcard.getFirstPropertyValue('photo')).to.match(/123\/456\/avatar\?t=[0-10]+/);
      });

    });

  });

});
