'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  describe('The contactsCacheService service', function() {
    var contactsCacheService;
    var $rootScope;

    beforeEach(function() {
      module('ngRoute');
      module('linagora.esn.contact');
    });

    function injectService() {
      inject(function($injector, _$rootScope_) {
        $rootScope = _$rootScope_;
        contactsCacheService = $injector.get('contactsCacheService');
      });
    }

    it('should create cache at initialization', function(done) {
      var CACHE_KEY = 'contactsList';
      module(function($provide) {
        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function(key) {
            expect(key).to.equal(CACHE_KEY);
            done();
          };
          return $delegate;
        });
      });
      injectService();
    });

    it('should put contacts to cache using CONTACTS_CACHE_KEY', function(done) {
      var CONTACTS_CACHE_KEY = 'contacts';
      module(function($provide) {
        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              put: function(key, data) {
                expect(key).to.equal(CONTACTS_CACHE_KEY);
                expect(data).to.equal('some data');
                done();
              }
            };
          };
          return $delegate;
        });
      });
      injectService();
      contactsCacheService.put('some data');
    });

    it('should get contacts from cache using CONTACTS_CACHE_KEY', function(done) {
      var CONTACTS_CACHE_KEY = 'contacts';
      module(function($provide) {
        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              get: function(key) {
                expect(key).to.equal(CONTACTS_CACHE_KEY);
                done();
              }
            };
          };
          return $delegate;
        });
      });
      injectService();
      contactsCacheService.get();
    });

    it('should clear cache when user goes to outside contact module', function() {
      injectService();

      contactsCacheService.put([123]);
      var nextRoute = {
        originalPath: '/some/other/path'
      };
      $rootScope.$emit('$routeChangeStart', nextRoute);
      expect(contactsCacheService.get()).to.not.be.defined;

      contactsCacheService.put([123]);
      nextRoute.originalPath = '/contactAbc';
      $rootScope.$emit('$routeChangeStart', nextRoute);
      expect(contactsCacheService.get()).to.not.be.defined;
    });

    it('should not clear cache when user is still contact module', function() {
      injectService();
      contactsCacheService.put([123]);
      var nextRoute = {
        originalPath: '/contact/path'
      };
      $rootScope.$emit('$routeChangeStart', nextRoute);
      expect(contactsCacheService.get()).to.eql([123]);

      nextRoute.originalPath = '/contact';
      $rootScope.$emit('$routeChangeStart', nextRoute);
      expect(contactsCacheService.get()).to.eql([123]);
    });

    it('should add contact to cache on contact:created event', function() {
      injectService();
      contactsCacheService.put([123]);
      $rootScope.$emit('contact:created', 456);
      expect(contactsCacheService.get()).to.eql([123, 456]);
    });

    it('should update contact on contact:updated event', function() {
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
      $rootScope.$emit('contact:updated', newContact);
      expect(contactsCacheService.get()).to.eql([newContact]);
    });

    it('should delete contact on contact:delete event', function() {
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
      $rootScope.$emit('contact:deleted', contact2);
      expect(contactsCacheService.get()).to.eql([contact1]);
    });

    it('should add contact again on contact:cancel:delete event', function() {
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
      $rootScope.$emit('contact:cancel:delete', contact3);
      expect(contactsCacheService.get()).to.eql([contact1, contact2, contact3]);
    });

  });

  describe('The contactsService service', function() {
    var ICAL, contact, contactWithChangedETag, contactAsJCard;

    beforeEach(function() {
      var self = this;
      this.tokenAPI = {
        getNewToken: function() {
          return $q.when({ data: { token: self._token } });
        }
      };
      this.uuid4 = {
        // This is a valid uuid4. Change this if you need other uuids generated.
        _uuid: '00000000-0000-4000-a000-000000000000',
        generate: function() {
          return this._uuid;
        }
      };
      this.notificationFactory = {};

      contact = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last'};
      contactWithChangedETag = { id: '00000000-0000-4000-a000-000000000000', lastName: 'Last', etag: 'changed-etag' };
      contactAsJCard = ['vcard', [
        ['uid', {}, 'text', '00000000-0000-4000-a000-000000000000'],
        ['n', {}, 'text', ['Last', '', '', '', '']]
      ], []];

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module(function($provide) {
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('tokenAPI', self.tokenAPI);
        $provide.value('uuid4', self.uuid4);
        $provide.value('gracePeriodService', self.gracePeriodService);
      });
    });

    beforeEach(angular.mock.inject(function(contactsService, contactsCacheService, notificationFactory, $httpBackend, $rootScope, $q, _ICAL_, DAV_PATH, GRACE_DELAY) {
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
    }));

    describe('The list fn', function() {
      it('should list cards', function(done) {

        var contactsURL = '/addressbooks/5375de4bd684db7f6fbd4f97/contacts.json';
        var result = {
          _links: {
            self: {
              href: '/addressbooks/5375de4bd684db7f6fbd4f97/contacts.json'
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
                    ['uid', {}, 'text', 'myuid'],
                    ['n', {}, 'text', ['Burce', 'Willis', '', '', '']]
                  ]
                ]
              }
            ]
          }
        };

        // The carddav server will be hit
        this.$httpBackend.expectGET(this.getExpectedPath(contactsURL)).respond(result);

        this.contactsService.list('5375de4bd684db7f6fbd4f97').then(function(cards) {
            expect(cards).to.be.an.array;
            expect(cards.length).to.equal(1);
            expect(cards[0].id).to.equal('myuid');
            expect(cards[0].vcard).to.be.an('object');
            expect(cards[0].etag).to.be.empty;
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should return contacts from cache when possible', function(done) {
        sinon.stub(this.contactsCacheService, 'get', function() {
          return [123, 456];
        });
        this.contactsService.list().then(function(cards) {
          expect(cards).to.eql([123, 456]);
          done();
        });
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

      it('should emit contact:created event with created contact when success', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(201);

        this.$httpBackend.expectGET(this.getExpectedPath(requestPath)).respond(201,
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []]
        );

        this.$rootScope.$on('contact:created', function(e, contact) {
          expect(contact.id).to.equal('myuid');
          done();
        });

        var spy = sinon.spy(this.$rootScope, '$emit');
        this.contactsService.create(1, contact).then(function() {
          expect(spy.withArgs('contact:created').calledOnce).to.be.true;
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
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(201, contactAsJCard);

        this.contactsService.modify(1, contact).then(null, function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 200', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(200, contactAsJCard, { 'ETag': 'changed-etag' });

        this.contactsService.modify(1, contact).then(
          function(shell) {
            expect(shell).to.shallowDeepEqual(contactWithChangedETag);
            done();
          });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(204, '');
        this.$httpBackend.expectGET(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(200, contactAsJCard, { 'ETag': 'changed-etag' });

        this.contactsService.modify(1, contact).then(
          function(shell) {
            expect(shell).to.shallowDeepEqual(contactWithChangedETag);
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
          'ESNToken': '123',
          'Accept': 'application/json, text/plain, */*'
        };
        this._token = requestHeaders.ESNToken;

        this.$httpBackend.expectPUT(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf'), function() { return true; }, requestHeaders).respond(200, contactAsJCard);

        contact.etag = 'etag';
        this.contactsService.modify(1, contact).then(function() { done(); });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should emit contact:updated event with updated contact on 200', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(200,
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []], { 'ETag': 'changed-etag' });

        var spy = sinon.spy(this.$rootScope, '$emit');
        this.$rootScope.$on('contact:updated', function(e, contact) {
          expect(contact.id).to.equal('myuid');
          expect(spy.calledOnce).to.be.true;
          done();
        });

        this.contactsService.modify(1, contact);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should emit contact:updated event with updated contact on 204', function(done) {
        var requestPath = '/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf';
        this.$httpBackend.expectPUT(this.getExpectedPath(requestPath)).respond(204, '');
        this.$httpBackend.expectGET(this.getExpectedPath(requestPath)).respond(200,
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []], { 'ETag': 'changed-etag' });

        var spy = sinon.spy(this.$rootScope, '$emit');
        this.$rootScope.$on('contact:updated', function(e, contact) {
          expect(contact.id).to.equal('myuid');
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

      it('should display correct title and link during the grace period', function(done) {
        this.notificationFactory.weakInfo = function() {};

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

      it('should pass the graceperiod as a query parameter if defined', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf?graceperiod=1234')).respond(204);

        this.contactsService.remove(1, contact, 1234).then(function() { done(); });

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should broadcast contact:deleted on success', function(done) {
        this.$httpBackend.expectDELETE(this.getExpectedPath('/addressbooks/1/contacts/00000000-0000-4000-a000-000000000000.vcf')).respond(204);

        this.$rootScope.$on('contact:deleted', function(e, data) {
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
          'ESNToken': '123',
          'Accept': 'application/json, text/plain, */*'
        };
        this._token = requestHeaders.ESNToken;

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

  });

  describe('The ContactsHelper service', function() {

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

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
    });

    beforeEach(angular.mock.inject(function(ContactsHelper, $rootScope) {
      this.$rootScope = $rootScope;
      this.contactHelper = ContactsHelper;
    }));

    describe('The getFormattedName function', function() {

      beforeEach(function() {
        this.shell = {
          starred: true,
          tags: [],
          emails: [],
          tel: [],
          addresses: [{ type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co' }],
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
  });

});
