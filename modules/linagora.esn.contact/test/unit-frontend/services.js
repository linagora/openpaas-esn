'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  describe('The contactsService service', function() {
    var ICAL;

    beforeEach(function() {
      var self = this;
      this.tokenAPI = {};
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

    beforeEach(angular.mock.inject(function(contactsService, $httpBackend, $rootScope, $q, _ICAL_, DAV_PATH) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.contactsService = contactsService;
      this.$q = $q;
      this.DAV_PATH = DAV_PATH;

      this.getExpectedPath = function(path) {
        return this.DAV_PATH + path;
      };

      ICAL = _ICAL_;

      var self = this;
      self.tokenAPI.getNewToken = function() {
        var token = self._token;
        var defer = self.$q.defer();
        defer.resolve({data: {token: token}});
        return defer.promise;
      };
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

        this.contactsService.list(contactsURL).then(function(cards) {
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

      it('should return a contact', function(done) {

        // The caldav server will be hit
        this.$httpBackend.expectGET(this.getExpectedPath('/path/to/card.vcf')).respond(
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

        this.contactsService.getCard('/path/to/card.vcf').then(function(contact) {
          expect(contact).to.be.an('object');
          expect(contact.id).to.equal('myuid');

          expect(contact.vcard).to.be.an('object');
          expect(contact.path).to.equal('/path/to/card.vcf');
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
          expect(contact.birthday.getTime()).to.equal(new Date(2015, 0, 1).getTime());
          expect(contact.nickname).to.equal('nick');
          expect(contact.notes).to.equal('notes');
          expect(contact.photo).to.equal('data:image/png;base64,iVBOR=');
        }.bind(this)).finally (done);

        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should return a contact with no photo if not defined in vCard', function(done) {
        this.$httpBackend.expectGET(this.getExpectedPath('/path/to/card.vcf')).respond(
          ['vcard', [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'myuid']
          ], []]
        );

        this.contactsService.getCard('/path/to/card.vcf').then(function(contact) {
          expect(contact.photo).to.not.exist;
        }.bind(this)).finally (done);

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

        // The caldav server will be hit
        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/book/00000000-0000-4000-a000-000000000000.vcf')).respond(500, '');

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

        // The caldav server will be hit
        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/book/00000000-0000-4000-a000-000000000000.vcf')).respond(200, '');

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

        // The carddav server will be hit
        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/book/00000000-0000-4000-a000-000000000000.vcf')).respond(201, vcard.toJSON());

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
      });

      it('should fail if status is 201', function(done) {
        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/uid.vcf')).respond(201, this.vcard.toJSON());

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
        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/uid.vcf')).respond(200, this.vcard.toJSON(), { 'ETag': 'changed-etag' });

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
        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/uid.vcf')).respond(204, '');
        this.$httpBackend.expectGET(this.getExpectedPath('/path/to/uid.vcf')).respond(200, this.vcard.toJSON(), headers);

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
        this._token = requestHeaders.ESNToken;

        this.$httpBackend.expectPUT(this.getExpectedPath('/path/to/uid.vcf'), this.vcard.toJSON(), requestHeaders).respond(200, this.vcard.toJSON(), { 'ETag': 'changed-etag' });

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
    });

    describe('The remove fn', function() {

      beforeEach(function() {
        this.contact = {id: '00000000-0000-4000-a000-000000000000'};
      });

      function unexpected(done) {
        done(new Error('Unexpected'));
      }

      it('should fail on a status that is not 204', function(done) {

        this.$httpBackend.expectDELETE(this.getExpectedPath('/path/to/book/00000000-0000-4000-a000-000000000000.vcf')).respond(201);

        this.contactsService.remove('/path/to/book', this.contact).then(
          unexpected.bind(null, done), function(response) {
            expect(response.status).to.equal(201);
            done();
          }
        );
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should succeed when everything is correct', function(done) {

        this.$httpBackend.expectDELETE(this.getExpectedPath('/path/to/book/00000000-0000-4000-a000-000000000000.vcf')).respond(204);

        this.contactsService.remove('/path/to/book', this.contact).then(
          function(response) {
            expect(response.status).to.equal(204);
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

        this.$httpBackend.expectDELETE(this.getExpectedPath('/path/to/book/00000000-0000-4000-a000-000000000000.vcf'), requestHeaders).respond(204);

        this.contactsService.remove('/path/to/book', this.contact, 'etag').then(
          function() { done(); }, unexpected.bind(null, done)
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
