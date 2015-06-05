'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  describe('The contact controller', function() {

    beforeEach(function() {
      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module('esn.alphalist');
    });

    beforeEach(angular.mock.inject(function($controller, $rootScope) {
      this.controller = $controller;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
    }));

    describe('The contactsListController controller', function() {

      describe('The loadContacts function', function() {

        it('should call the contactsService.list fn', function(done) {
          var user = {_id: 123};
          var contactsService = {
            list: function(path) {
              expect(path).to.equal('/addressbooks/' + user._id + '/contacts');
              done();
            }
          };

          this.controller('contactsListController', {
            $scope: this.scope,
            contactsService: contactsService,
            user: user
          });
          this.scope.loadContacts();
        });
      });
    });
  });

  describe('The contactsService service', function() {
    var ICAL;

    beforeEach(function() {
      var self = this;
      this.tokenAPI = {
        _token: '123',
        getNewToken: function() {
          var token = this._token;
          return {
            then: function(callback) {
              callback({ data: { token: token } });
            }
          };
        }
      };
      this.uuid4 = {
        // This is a valid uuid4. Change this if you need other uuids generated.
        _uuid: '00000000-0000-4000-a000-000000000000',
        generate: function() {
          return this._uuid;
        }
      };

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module(function($provide) {
        $provide.value('tokenAPI', self.tokenAPI);
        $provide.value('uuid4', self.uuid4);
      });
    });

    beforeEach(angular.mock.inject(function(contactsService, $httpBackend, $rootScope, _ICAL_) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.contactsService = contactsService;

      ICAL = _ICAL_;
    }));

    describe('The list fn', function() {
      it('should list cards', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The carddav server will be hit
        var data = {
          scope: { addressbooks: ['/path/to/addressbook'] }
        };
        this.$httpBackend.expectPOST('/json/queries/contacts', data).respond([
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []]
        ]);

        this.contactsService.list('/path/to/addressbook').then(function(cards) {
            expect(cards).to.be.an.array;
            expect(cards.length).to.equal(1);
            expect(cards[0].id).to.equal('myuid');
            expect(cards[0].vcard).to.be.an('object');
            expect(cards[0].etag).to.be.empty;
            expect(cards[0].path).to.be.empty;
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The getCard fn', function() {
      it('should return an event', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectGET('/path/to/card.vcf').respond(
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
            ['note', {}, 'text', 'notes']
          ], []],
          // headers:
          { 'ETag': 'testing-tag' }
        );

        this.contactsService.getCard('/path/to/card.vcf').then(function(event) {
          expect(event).to.be.an('object');
          expect(event.id).to.equal('myuid');

          expect(event.vcard).to.be.an('object');
          expect(event.path).to.equal('/path/to/card.vcf');
          expect(event.etag).to.equal('testing-tag');

          expect(event.firstName).to.equal('first');
          expect(event.lastName).to.equal('last');
          expect(event.displayName).to.equal('first last');
          expect(event.emails).to.deep.equal([{type: 'Work', value: 'foo@example.com'}]);
          expect(event.addresses).to.deep.equal([{
            type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co'
          }]);
          expect(event.org).to.equal('org');
          expect(event.orgUri).to.equal('http://linagora.com');
          expect(event.orgRole).to.equal('role');
          expect(event.social).to.deep.equal([{ type: 'Twitter', value: '@AwesomePaaS' }]);
          expect(event.tags).to.deep.equal([{ text: 'asdf' }]);
          expect(event.starred).to.be.true;
          expect(event.birthday.getTime()).to.equal(new Date(2015, 0, 1).getTime());
          expect(event.nickname).to.equal('nick');
          expect(event.notes).to.equal('notes');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The create fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      it('should fail on missing uid', function(done) {
        var vcard = new ICAL.Component('vcard');

        this.contactsService.create('/path/to/book', vcard).then(
          unexpected.bind(null, done), function(e) {
            expect(e.message).to.equal('Missing UID in VCARD');
            done();
          }
        );
        this.$rootScope.$apply();
      });

      it('should fail on 500 response status', function(done) {
        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('/path/to/book/00000000-0000-4000-a000-000000000000.vcf').respond(500, '');

        var vcard = new ICAL.Component('vcard');
        vcard.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');

        this.contactsService.create('/path/to/book', vcard).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(500);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should fail on a 2xx status that is not 201', function(done) {
        var vcard = new ICAL.Component('vcard');
        vcard.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');

        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The caldav server will be hit
        this.$httpBackend.expectPUT('/path/to/book/00000000-0000-4000-a000-000000000000.vcf').respond(200, '');

        this.contactsService.create('/path/to/book', vcard).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(200);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed when everything is correct', function(done) {
        var vcard = new ICAL.Component('vcard');
        vcard.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');

        // The server url needs to be retrieved
        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});

        // The carddav server will be hit
        this.$httpBackend.expectPUT('/path/to/book/00000000-0000-4000-a000-000000000000.vcf').respond(201, vcard.toJSON());

        this.contactsService.create('/path/to/book', vcard).then(
          function(response) {
            expect(response.status).to.equal(201);
            expect(response.data).to.deep.equal(vcard.toJSON());
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });

    describe('The modify fn', function() {
      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      beforeEach(function() {
        var vcard = new ICAL.Component('vcard');
        vcard.addPropertyWithValue('version', '4.0');
        vcard.addPropertyWithValue('uid', '00000000-0000-4000-a000-000000000000');
        vcard.addPropertyWithValue('fn', 'test card');
        this.vcard = vcard;

        this.$httpBackend.expectGET('/davserver/api/info').respond({ url: ''});
      });

      it('should fail if status is 201', function(done) {
        this.$httpBackend.expectPUT('/path/to/uid.vcf').respond(201, this.vcard.toJSON());

        this.contactsService.modify('/path/to/uid.vcf', this.vcard).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 200', function(done) {
        this.$httpBackend.expectPUT('/path/to/uid.vcf').respond(200, this.vcard.toJSON(), { 'ETag': 'changed-etag' });

        this.contactsService.modify('/path/to/uid.vcf', this.vcard).then(
          function(shell) {
            expect(shell.displayName).to.equal('test card');
            expect(shell.etag).to.equal('changed-etag');
            expect(shell.vcard.toJSON()).to.deep.equal(this.vcard.toJSON());
            done();
          }.bind(this), unexpected.bind(null, done)
        );

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed on 204', function(done) {
        var headers = { 'ETag': 'changed-etag' };
        this.$httpBackend.expectPUT('/path/to/uid.vcf').respond(204, '');
        this.$httpBackend.expectGET('/path/to/uid.vcf').respond(200, this.vcard.toJSON(), headers);

        this.contactsService.modify('/path/to/uid.vcf', this.vcard).then(
          function(shell) {
            expect(shell.displayName).to.equal('test card');
            expect(shell.etag).to.equal('changed-etag');
            done();
          }, unexpected.bind(null, done)
        );

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
        this.$httpBackend.expectPUT('/path/to/uid.vcf', this.vcard.toJSON(), requestHeaders).respond(200, this.vcard.toJSON(), { 'ETag': 'changed-etag' });

        this.contactsService.modify('/path/to/uid.vcf', this.vcard, 'etag').then(
          function(shell) { done(); }, unexpected.bind(null, done)
        );

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
          notes: 'notes'
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
          note: 'NOTE:notes'
        };

        compareShell(this.contactsService, shell, ical);
      });
    });
  });
});
