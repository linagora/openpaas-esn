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

    beforeEach(angular.mock.inject(function(contactsService, $httpBackend, $rootScope, $q, _ICAL_, DAV_PATH, GRACE_DELAY, _CONTACT_EVENTS_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.contactsService = contactsService;
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
      var result, options;

      function checkResult(done) {
        return function(data) {
          expect(data.contacts).to.be.an.array;
          expect(data.contacts.length).to.equal(1);
          expect(data.contacts[0].id).to.equal(uid);
          expect(data.current_page).to.eql(options.page);
          done();
        };
      }

      beforeEach(function() {
        options = {};
        result = {
          _links: {
            self: {
              href: contactsURL
            }
          },
          'dav:syncToken': 6,
          _embedded: {
            'dav:item': [
              {
                _links: {
                  self: '/addressbooks/5375de4bd684db7f6fbd4f97/contacts/myuid.vcf'
                },
                etag: '\'6464fc058586fff85e3522de255c3e9f\'',
                data: [
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

      it('should list cards', function(done) {
        this.$httpBackend.expectGET(this.getExpectedPath(contactsURL) + '?sort=fn').respond(result);

        this.contactsService.list(bookId).then(function(data) {
          var cards = data.contacts;
          expect(cards).to.be.an.array;
          expect(cards.length).to.equal(1);
          expect(cards[0].id).to.equal(uid);
          expect(cards[0].vcard).to.be.an('object');
          expect(cards[0].etag).to.be.empty;
        }.bind(this)).finally(done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call the backend with right parameters', function(done) {
        options.paginate = true;
        options.page = 1;
        options.limit = 10;
        var url = this.getExpectedPath(contactsURL) + '?limit=10&offset=0&sort=fn&userId=' + userId;
        this.$httpBackend.expectGET(url).respond(result);
        this.contactsService.list(bookId, userId, options).then(checkResult(done));
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should return next_page when not reached last_page', function(done) {
        result._links.next = true;
        options.paginate = true;
        options.limit = 10;
        var url = this.getExpectedPath(contactsURL) + '?limit=10&offset=0&sort=fn&userId=' + userId;
        this.$httpBackend.expectGET(url).respond(result);

        this.contactsService.list(bookId, userId, options).then(function(data) {
          expect(data.next_page).to.equal(2);
          done();
        });
        this.$httpBackend.flush();
        this.$rootScope.$apply();
      });

      it('should not return next_page when reached last_page', function(done) {
        result._links.next = false;
        options.paginate = true;
        options.limit = 10;
        var url = this.getExpectedPath(contactsURL) + '?limit=10&offset=0&sort=fn&userId=' + userId;
        this.$httpBackend.expectGET(url).respond(result);

        this.contactsService.list(bookId, userId, options).then(function(data) {
          expect(data.next_page).to.not.be.defined;
          done();
        });
        this.$httpBackend.flush();
        this.$rootScope.$apply();
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
            ['url', {}, 'uri', 'http://linagora.com'],
            ['role', {}, 'text', 'role'],
            ['socialprofile', { type: 'Twitter' }, 'text', '@AwesomePaaS'],
            ['categories', {}, 'text', 'starred', 'asdf'],
            ['bday', {}, 'date', '2015-01-01'],
            ['nickname', {}, 'text', 'nick'],
            ['note', {}, 'text', 'notes'],
            ['photo', {}, 'text', 'data:image/png;base64,iVBOR=']
          ], []],
          // headers:
          { ETag: 'testing-tag' }
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
          expect(contact.urls).to.eql([{ value: 'http://linagora.com' }]);
          expect(contact.orgRole).to.equal('role');
          expect(contact.social).to.deep.equal([{ type: 'Twitter', value: '@AwesomePaaS' }]);
          expect(contact.tags).to.deep.equal([{ text: 'asdf' }]);
          expect(contact.starred).to.be.true;
          expect(contact.birthday).to.equalDate(new Date(2015, 0, 1));
          expect(contact.nickname).to.equal('nick');
          expect(contact.notes).to.equal('notes');
          expect(contact.photo).to.equal('data:image/png;base64,iVBOR=');
        }.bind(this)).finally(done);

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
        }.bind(this)).finally(done);

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
          { ETag: 'testing-tag' }
        );

        this.contactsService.getCard(1, 2).then(function(contact) {
          expect(contact.birthday).to.equal('a text birthday');
        }.bind(this)).finally(done);

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
          Prefer: 'return-representation',
          'If-Match': 'etag',
          Accept: 'application/json, text/plain, */*'
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
          orgName: 'org',
          orgRole: 'role',
          urls: [{ value: 'http://mywebsite.com' }],
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
          url: 'URL:http://mywebsite.com',
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
          Accept: 'application/json, text/plain, */*'
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
            return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
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
            return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
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
            return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
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
            return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
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
            return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
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
            return [204, '', {'X-ESN-TASK-ID': 'myTaskId'}];
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

    describe('The fillScopeContactData function', function() {

      it('should not modify scope when contact is undefined', function() {
        var scope = {};
        this.contactHelper.fillScopeContactData(scope);
        expect(scope).to.deep.equal({});
      });

      it('should fill the scope with the contact', function() {
        var scope = {};
        var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.contact).to.deep.equal(contact);
      });

      it('should fill the scope with the contact emails', function() {
        var scope = {};
        var contact = {emails: [{type: 'work', value: 'me@work.com'}, {type: 'home', value: 'me@home.com'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.emails.length).to.equal(2);
      });

      it('should fill the scope with the contact phones', function() {
        var scope = {};
        var contact = {tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.phones.length).to.equal(2);
      });

      it('should fill the scope with the contact formattedBirthday', function() {
        var scope = {};
        var contact = {birthday: '123', tel: [{type: 'work', value: '+33333333'}, {type: 'home', value: '+33444444'}]};
        this.contactHelper.fillScopeContactData(scope, contact);
        expect(scope.formattedBirthday).to.be.defined;
      });
    });

    describe('The getOrderedValues function', function() {
      it('should return empty array when input is undefined', function() {
        expect(this.contactHelper.getOrderedValues()).to.deep.equal([]);
      });

      it('should return empty array when input is input array', function() {
        expect(this.contactHelper.getOrderedValues([])).to.deep.equal([]);
      });

      it('should return ordered elements based on given priority', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        expect(this.contactHelper.getOrderedValues([a, b, c], ['b', 'c', 'a'])).to.deep.equal([b, c, a]);
      });

      it('should return input when priorities are not defined', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        expect(this.contactHelper.getOrderedValues([a, b, c])).to.deep.equal([a, b, c]);
      });

      it('should return input when priorities are empty', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        expect(this.contactHelper.getOrderedValues([a, b, c], [])).to.deep.equal([a, b, c]);
      });

      it('should return only element with given priorities', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        var d = {type: 'd', value: 4};
        var e = {type: 'e', value: 5};
        expect(this.contactHelper.getOrderedValues([a, b, c, d, e], ['c', 'b', 'a'])).to.deep.equal([c, b, a]);
      });

      it('should return ordered elements based on given priority even when same types appears several times', function() {
        var a = {type: 'a', value: 1};
        var b = {type: 'b', value: 2};
        var c = {type: 'c', value: 3};
        var d = {type: 'd', value: 4};
        var e = {type: 'e', value: 6};
        var aa = {type: 'a', value: 5};
        var bb = {type: 'b', value: 7};
        expect(this.contactHelper.getOrderedValues([a, b, c, d, e, aa, bb], ['a', 'b'])).to.deep.equal([a, aa, b, bb]);
      });

    });

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

        this.url = { value: 'http://linagora.com' };

      });

      beforeEach(function() {
        this.shell = {};

        this.expectEqual = function(value) {
          expect(this.contactHelper.getFormattedName(this.shell)).to.equal(value);
        };

        this.expectUndefined = function() {
          expect(this.contactHelper.getFormattedName(this.shell)).to.be.undefined;
        };
      });

      it('should return firstname when firstname defined and lastname undefined', function() {
        this.shell.firstName = 'Foo';
        this.expectEqual(this.shell.firstName);
      });

      it('should return lastname when firstname undefined and lastname defined', function() {
        this.shell.lastName = 'Bar';
        this.expectEqual(this.shell.lastName);
      });

      it('should return undefined when no values', function() {
        this.expectUndefined();
      });

      it('should return birthday as-is if defined but not a Date', function() {
        this.shell.birthday = 'I am not a date';
        this.expectEqual('I am not a date');
      });

      it('should return with the correct order', function() {
        this.shell = {
          firstName: 'Foo',
          lastName: 'Bar',
          orgName: 'MyOrg',
          orgRole: 'role',
          nickname: 'FooBar',
          emails: [this.workEmail, this.homeEmail, this.otherEmail],
          social: [this.twitter, this.skype, this.google, this.linkedin, this.fb, this.otherSocial],
          urls: [this.url],
          tel: [this.workTel, this.mobileTel, this.homeTel, this.otherTel],
          notes: 'This is a note',
          tags: [{text: 'A'}, {text: 'B'}],
          birthday: new Date(1942, 0, 1),
          addresses: [{street: 'My street', zip: 'My zip', city: 'My city', country: 'My country'}],
          starred: true,
          photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA'
        };

        this.expectEqual(this.shell.firstName + ' ' + this.shell.lastName);

        this.shell.firstName = this.shell.lastName = '';
        this.expectEqual('MyOrg');

        this.shell.orgName = '';
        this.expectEqual('role');

        this.shell.orgRole = '';
        this.expectEqual('FooBar');

        this.shell.nickname = '';
        this.expectEqual(this.workEmail.value);

        this.shell.emails.shift();
        this.expectEqual(this.homeEmail.value);

        this.shell.emails.shift();
        this.expectEqual(this.otherEmail.value);

        this.shell.emails.shift();
        this.expectEqual(this.twitter.value);

        this.shell.social.shift();
        this.expectEqual(this.skype.value);

        this.shell.social.shift();
        this.expectEqual(this.google.value);

        this.shell.social.shift();
        this.expectEqual(this.linkedin.value);

        this.shell.social.shift();
        this.expectEqual(this.fb.value);

        this.shell.social.shift();
        this.expectEqual(this.otherSocial.value);

        this.shell.social.shift();
        this.expectEqual(this.url.value);

        this.shell.urls.shift();
        this.expectEqual(this.workTel.value);

        this.shell.tel.shift();
        this.expectEqual(this.mobileTel.value);

        this.shell.tel.shift();
        this.expectEqual(this.homeTel.value);

        this.shell.tel.shift();
        this.expectEqual(this.otherTel.value);

        this.shell.tel.shift();
        this.expectEqual('This is a note');

        this.shell.notes = '';
        this.expectEqual('A');

        this.shell.tags.shift();
        this.expectEqual('B');

        this.shell.tags.shift();
        this.expectEqual('01/01/1942');

        this.shell.birthday = '';
        this.expectEqual('My street My city My zip My country');
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

  describe('The toggleContactDisplayService', function() {
    var $rootScope,
      $cacheFactory,
      toggleContactDisplayService,
      toggleEventService,
      CONTACT_LIST_DISPLAY,
      CONTACT_LIST_DISPLAY_EVENTS;

    var toggleEventServiceMock = {
      broadcast: function() {},
      listen: function() {}
    };

    beforeEach(function() {

      module(function($provide) {
        $provide.value('toggleEventService', toggleEventServiceMock);
      });
      inject(function(_$rootScope_, _toggleContactDisplayService_, _toggleEventService_, _CONTACT_LIST_DISPLAY_, _CONTACT_LIST_DISPLAY_EVENTS_, _$cacheFactory_) {
        $rootScope = _$rootScope_;
        toggleContactDisplayService = _toggleContactDisplayService_;
        toggleEventService = _toggleEventService_;
        CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
        $cacheFactory = _$cacheFactory_;
      });
    });

    describe('The getInitialDisplay function', function() {

      it('should return list as default value', function() {
        expect(toggleContactDisplayService.getInitialDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
      });

      it('should return the data from cache when current is not defined', function() {
        var value = CONTACT_LIST_DISPLAY.cards;
        toggleContactDisplayService._cacheValue(value);
        expect(toggleContactDisplayService.getInitialDisplay()).to.equal(value);
      });

    });

    describe('The getCurrentDisplay function', function() {

      it('should return list as default value when current is not defind', function() {
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
      });

      it('should return the current value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

    });

    describe('The setCurrentDisplay function', function() {
      it('should cache value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });

      it('should cache value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });

      it('should set current value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

      it('should broadcast event', function(done) {
        var value = 'foo';
        toggleEventServiceMock.broadcast = function() {
          done();
        };
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

    });

    describe('The _getCache function', function() {
      it('should return an object', function() {
        expect(toggleContactDisplayService._getCache()).to.be.an.object;
      });
    });

    describe('The cache value functions', function() {
      it('should be able to get a cached value', function() {
        var value = 'foobar';
        toggleContactDisplayService._cacheValue(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });
    });
  });

  describe('The toggleEventService service', function() {
    var $rootScope,
      toggleEventService,
      CONTACT_LIST_DISPLAY_EVENTS;

    beforeEach(function() {
      inject(function(_$rootScope_, _toggleEventService_, _CONTACT_LIST_DISPLAY_EVENTS_) {
        $rootScope = _$rootScope_;
        toggleEventService = _toggleEventService_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
      });
    });

    describe('The broadcast function', function() {
      it('should call $rootScope.$broadcast with toggle event', function(done) {

        var data = 'My event';
        $rootScope.$on(CONTACT_LIST_DISPLAY_EVENTS.toggle, function(evt, value) {
          expect(value).to.equal(data);
          done();
        });

        toggleEventService.broadcast(data);
      });
    });

    describe('The listen function', function() {
      it('should listen to toggle event', function(done) {

        var eventCallback = function() {};
        var scope = {
          $on: function(event, callback) {
            expect(CONTACT_LIST_DISPLAY_EVENTS.toggle).to.equal(event);
            expect(callback).to.equal(eventCallback);
            done();
          }
        };
        toggleEventService.listen(scope, eventCallback);
      });

      it('should call event callback', function(done) {
        var event = 'My event';
        var scope = $rootScope.$new();
        function callback(evt, data) {
          expect(data).to.equal(event);
          done();
        }
        toggleEventService.listen(scope, callback);
        toggleEventService.broadcast(event);
      });
    });

  });

  describe('The addScrollingBehavior service', function() {
    var $rootScope, $window, event, $scope;
    var addScrollingBehavior, sharedContactDataService, scrollingBehavior;
    var angularFind;
    var letterOffset = 0,
      contactHeaderOffset = 0,
      contactControlOffset = 0;

    var angularFindResult = {
      h2: {
        getBoundingClientRect: function() {
          return {
            bottom: letterOffset
          };
        }
      },
      blockHeader: {
        textContent: 'A',
        getElementsByTagName: function() {
          return [angularFindResult.h2];
        }
      },
      contactControl: {
        getBoundingClientRect: function() {
          return {
            bottom: contactHeaderOffset
          };
        }
      },
      contactHeader: {
        getBoundingClientRect: function() {
          return {
            bottom: contactControlOffset
          };
        }
      }
    };

    var element = {
      find: function() {
        return $([angularFindResult.blockHeader]);
      }
    };

    beforeEach(function() {
      // Simulate angular.element.find and restore after
      angularFind = angular.element.find;
      angular.element.find = function(value) {
        switch (value) {
          case '.contact-controls':
            return [angularFindResult.contactControl];
          case '.contacts-list-header':
            return [angularFindResult.contactHeader];
        }
      };

      inject(function(_$rootScope_, _$window_, _addScrollingBehavior_, _CONTACT_SCROLL_EVENTS_, _sharedContactDataService_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $window = _$window_;
        addScrollingBehavior = _addScrollingBehavior_;
        sharedContactDataService = _sharedContactDataService_;
        event = _CONTACT_SCROLL_EVENTS_;
      });

      scrollingBehavior = addScrollingBehavior(element);
      sharedContactDataService.categoryLetter = '#';
    });

    afterEach(function() {
      angular.element.find = angularFind;
      angular.element($window).off('scroll');
    });

    it('should not broadcast the letter when it is not hidden', function(done) {
      letterOffset = 100;
      contactHeaderOffset = 0;
      sharedContactDataService.categoryLetter = '';
      $scope.$on(event, function() {
        done('Error');
      });
      angular.element($window).triggerHandler('scroll');
      done();
    });

    it('should not broadcast the letter when it is not changed', function(done) {
      letterOffset = 100;
      contactHeaderOffset = 200;
      sharedContactDataService.categoryLetter = 'A';
      $scope.$on(event, function() {
        done('Error');
      });
      angular.element($window).triggerHandler('scroll');
      done();
    });

    it('should broadcast the letter when it is changed', function() {
      letterOffset = 100;
      contactHeaderOffset = 200;
      $scope.$on(event, function(evt, data) {
        expect(data).to.deep.equal('A');
      });
      angular.element($window).triggerHandler('scroll');
    });

    it('should return the function to remove scroll listener', function(done) {
      var angularElement = angular.element;
      angular.element = function() {
        return {
          off: function() {
            done();
          }
        };
      };

      scrollingBehavior.unregister();
      angular.element = angularElement;
    });
  });

});
