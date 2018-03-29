'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('ContactShell Builders', function() {

  var BOOK_ID = '123456789';
  var BOOK_NAME = 'contacts';
  var CARD_ID = 'mycardid';

  var vcard = ['vcard', [
    ['version', {}, 'text', '4.0'],
    ['uid', {}, 'text', CARD_ID],
    ['fn', {}, 'text', 'first last'],
    ['n', {}, 'text', ['last', 'first']],
    ['email', {type: 'Work'}, 'text', 'mailto:foo@example.com'],
    ['tel', {type: 'Work'}, 'uri', 'tel:123123'],
    ['adr', {type: 'Home'}, 'text', ['', '', 's', 'c', '', 'z', 'co']],
    ['org', {}, 'text', 'org'],
    ['url', {}, 'uri', 'http://linagora.com'],
    ['role', {}, 'text', 'role'],
    ['socialprofile', {type: 'Twitter'}, 'text', '@AwesomePaaS'],
    ['categories', {}, 'text', 'starred', 'asdf'],
    ['bday', {}, 'date', '2015-01-01'],
    ['nickname', {}, 'text', 'nick'],
    ['note', {}, 'text', 'notes'],
    ['photo', {}, 'text', 'data:image/png;base64,iVBOR=']
  ], []];

  describe('The AddressbookCache service', function() {

    var ContactAPIClientMock;

    beforeEach(function() {
      ContactAPIClientMock = {};
      module('linagora.esn.contact', function($provide) {
        $provide.value('ContactAPIClient', ContactAPIClientMock);
      });
    });

    beforeEach(function() {
      angular.mock.inject(function(AddressbookCache) {
        this.AddressbookCache = AddressbookCache;
      });
    });

    it('cache loader should fetch the AB from ContactAPIClient', function(done) {
      ContactAPIClientMock.addressbookHome = function(id) {
        expect(id).to.equal(BOOK_ID);
        return {
          addressbook: function(name) {
            expect(name).to.equal(BOOK_NAME);
            return {
              get: done
            };
          }
        };
      };
      this.AddressbookCache.loader({bookId: BOOK_ID, bookName: BOOK_NAME});
    });

    it('cache keyBuilder should build key from bookId and bookName', function() {
      expect(this.AddressbookCache.getKey({bookId: BOOK_ID, bookName: BOOK_NAME})).to.equal(BOOK_ID + '-' + BOOK_NAME);
    });
  });

  describe('The ContactShellBuilder service', function() {

    var contactAvatarService, ContactShellHelper, contactUpdateDataService;

    beforeEach(function() {
      contactAvatarService = {};
      ContactShellHelper = {};
      contactUpdateDataService = {};

      module('linagora.esn.contact', function($provide) {
        $provide.value('contactAvatarService', contactAvatarService);
        $provide.value('ContactShellHelper', ContactShellHelper);
        $provide.value('contactUpdateDataService', contactUpdateDataService);
      });
    });

    beforeEach(function() {
      angular.mock.inject(function(ContactShellBuilder, $rootScope) {
        this.ContactShellBuilder = ContactShellBuilder;
        this.$rootScope = $rootScope;
      });
    });

    describe('The setAddressbookCache function', function() {
      it('should save the given cache', function() {
        var cache = {foo: 'bar'};
        this.ContactShellBuilder.setAddressbookCache(cache);
        expect(this.ContactShellBuilder.addressbookCache).to.equal(cache);
      });
    });

    describe('The fromCardResponse function', function() {
      it('should', function() {

      });
    });

    describe('The fromCardListResponse function', function() {

      function expectEmpty(done) {
        return function(data) {
          expect(data).to.deep.equal([]);
          done();
        };
      }

      it('should resolve with empty array when input is undefined', function(done) {
        this.ContactShellBuilder.fromCardListResponse().then(expectEmpty(done));
        this.$rootScope.$apply();
      });

      it('should resolve with empty array when input.data is undefined', function(done) {
        this.ContactShellBuilder.fromCardListResponse({}).then(expectEmpty(done));
        this.$rootScope.$apply();
      });

      it('should resolve with empty array when input.data._embedded is undefined', function(done) {
        this.ContactShellBuilder.fromCardListResponse({data: {}}).then(expectEmpty(done));
        this.$rootScope.$apply();
      });

      it('should resolve with empty array when input.data._embedded["dav:item"]', function(done) {
        this.ContactShellBuilder.fromCardListResponse({data: {_embedded: {}}}).then(expectEmpty(done));
        this.$rootScope.$apply();
      });

      it('should resolve with empty array when input.data._embedded["dav:item"] is empty', function(done) {
        this.ContactShellBuilder.fromCardListResponse({data: {_embedded: {'dav:item': []}}}).then(expectEmpty(done));
        this.$rootScope.$apply();
      });

      it('should build the shell for all dav items', function(done) {
        var items = [1, 2];
        var spy = sinon.spy();
        this.ContactShellBuilder.fromCardResponse = function(vcard) {
          expect(items.indexOf(vcard) > -1).to.be.true;
          spy();
          return $q.when(vcard);
        };

        this.ContactShellBuilder.fromCardListResponse({data: {_embedded: {'dav:item': items}}}).then(function(result) {
          expect(result.length).to.equal(items.length);
          expect(spy).to.have.been.called.twice;
          done();
        });
        this.$rootScope.$apply();
      });
    });

    describe('The populateAddressbook function', function() {
      it('should set the cache response as shell addressbook', function(done) {
        var shell = {id: CARD_ID};
        var addressbook = {id: 1};
        this.ContactShellBuilder.addressbookCache = {
          get: function(options) {
            expect(options).to.deep.equal({
              bookId: BOOK_ID,
              bookName: BOOK_NAME
            });
            return $q.when(addressbook);
          }
        };
        this.ContactShellBuilder.populateAddressbook(shell, BOOK_ID, BOOK_NAME).then(function(result) {
          expect(result.addressbook).to.deep.equal(addressbook);
          done();
        }, done);

        this.$rootScope.$apply();
        done(new Error('Should not be called'));
      });

      it('should return the shell as is when cache fails', function(done) {
        var shell = {id: CARD_ID};
        this.ContactShellBuilder.addressbookCache = {
          get: function(options) {
            expect(options).to.deep.equal({
              bookId: BOOK_ID,
              bookName: BOOK_NAME
            });
            return $q.reject(new Error());
          }
        };
        this.ContactShellBuilder.populateAddressbook(shell, BOOK_ID, BOOK_NAME).then(function(result) {
          expect(result.id).to.deep.equal(CARD_ID);
          expect(result.addressbook).to.not.be.defined;
          done();
        }, done);

        this.$rootScope.$apply();
        done(new Error('Should not be called'));
      });
    });

    describe('The fromVcard function', function() {

      it('should force to reload the default avatar when contact is defined in update service', function() {
        var spy = sinon.spy();
        contactUpdateDataService.contactUpdatedIds = [CARD_ID];
        contactAvatarService.forceReloadDefaultAvatar = spy;
        this.ContactShellBuilder.fromVcard(vcard);
        expect(spy).to.have.been.called.once;
      });

      it('should return a ContactShell', function() {
        var spy = sinon.spy();
        contactUpdateDataService.contactUpdatedIds = [];
        contactAvatarService.forceReloadDefaultAvatar = spy;
        var contact = this.ContactShellBuilder.fromVcard(vcard);
        expect(spy).to.not.have.been.called;
        expect(contact).to.be.defined;
      });
    });

    describe('The populateShell function', function() {
      var shell, href;

      beforeEach(function() {
        shell = {id: 1};
        href = '/foo/bar';
      });

      function notModified(done) {
        return function(result) {
          expect(result).to.deep.equal(shell);
          done();
        };
      }

      it('should return the input shell when ContactShellHelper.getMetadata does not return metadata', function(done) {
        ContactShellHelper.getMetadata = function() {};
        this.ContactShellBuilder.populateShell(shell, href).then(notModified(done), done);
        this.$rootScope.$apply();
      });

      it('should return the input shell when ContactShellHelper.getMetadata does not return bookId', function(done) {
        ContactShellHelper.getMetadata = function() {
          return {
            bookName: BOOK_NAME
          };
        };
        this.ContactShellBuilder.populateShell(shell, href).then(notModified(done), done);
        this.$rootScope.$apply();
      });

      it('should return the input shell when ContactShellHelper.getMetadata does not return bookName', function(done) {
        ContactShellHelper.getMetadata = function() {
          return {
            bookId: BOOK_ID
          };
        };
        this.ContactShellBuilder.populateShell(shell, href).then(notModified(done), done);
        this.$rootScope.$apply();
      });

      it('should populate the shell', function(done) {
        var shell = {id: 1};
        ContactShellHelper.getMetadata = function() {
          return {
            bookId: BOOK_ID,
            bookName: BOOK_NAME
          };
        };
        var spy = sinon.spy();
        this.ContactShellBuilder.populateAddressbook = function(_shell, id, name) {
          expect(_shell).to.deep.equal(shell);
          expect(id).to.deep.equal(BOOK_ID);
          expect(name).to.deep.equal(BOOK_NAME);
          spy();
          return $q.when(shell);
        };
        this.ContactShellBuilder.populateShell(shell, href).then(function() {
          expect(spy).to.have.been.called;
          done();
        }, done);
        this.$rootScope.$apply();
      });
    });

    describe('The fromCardResponse function', function() {

      it('should build the shell', function() {
        var href = '/foo/bar';
        var card = {id: 1, _links: {self: {href: href}}, data: vcard};
        var result = {foo: 'bar'};
        var buildSpy = sinon.spy();
        var populateSpy = sinon.spy();

        this.ContactShellBuilder.fromVcard = function(data) {
          expect(data).to.deep.equal(vcard);
          buildSpy();
          return result;
        };
        this.ContactShellBuilder.populateShell = populateSpy;

        this.ContactShellBuilder.fromCardResponse(card);
        expect(buildSpy).to.have.been.called;
        expect(populateSpy).to.have.been.calledWith(result, href);
      });
    });

    describe('The fromWebSocket function', function() {
      it('should build the shell from websocket data', function() {
        var fromVcardSpy = sinon.spy();
        var populateAddressbookSpy = sinon.spy();
        var data = {
          vcard: vcard,
          bookId: BOOK_ID,
          bookName: BOOK_NAME
        };
        var result = 'foo';
        this.ContactShellBuilder.fromVcard = function(_vcard) {
          expect(_vcard).to.deep.equal(vcard);
          fromVcardSpy();
          return result;
        };
        this.ContactShellBuilder.populateAddressbook = populateAddressbookSpy;

        this.ContactShellBuilder.fromWebSocket(data);

        expect(fromVcardSpy).to.have.been.called;
        expect(populateAddressbookSpy).to.have.been.calledWith(result, BOOK_ID, BOOK_NAME);
      });
    });
  });

  describe('The VcardBuilder service', function() {
    var VcardBuilder;

    beforeEach(function() {
      module('linagora.esn.contact');
    });

    beforeEach(angular.mock.inject(function(_VcardBuilder_) {
      VcardBuilder = _VcardBuilder_;
    }));

    describe('The toVcard function', function() {

      function compareShell(shell, ical) {
        var vcard = VcardBuilder.toVcard(shell);
        var properties = vcard.getAllProperties();
        var propkeys = properties.map(function(p) {
          return p.name;
        }).sort();
        var icalkeys = Object.keys(ical).sort();

        var message = 'Key count mismatch in ical object.\n' +
          'expected: ' + icalkeys + '\n' +
          '   found: ' + propkeys;
        expect(properties.length).to.equal(icalkeys.length, message);

        Object.keys(ical).forEach(function(propName) {
          var prop = vcard.getFirstProperty(propName);
          expect(prop, 'Missing: ' + propName).to.be.ok;
          var value = prop.toICAL();
          expect(value).to.equal(ical[propName].toString());
        });
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

        compareShell(shell, ical);
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

        compareShell(shell, ical);
      });

      it('should correctly create a card with all props', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          lastName: 'last',
          firstName: 'first',
          starred: true,
          tags: [{text: 'a'}, {text: 'b'}],
          emails: [{type: 'Home', value: 'email@example.com'}],
          tel: [{type: 'Home', value: '123123'}],
          addresses: [{type: 'Home', street: 's', city: 'c', zip: 'z', country: 'co'}],
          social: [{type: 'Twitter', value: '@AwesomePaaS'}],
          orgName: 'org',
          orgRole: 'role',
          urls: [{value: 'http://mywebsite.com'}],
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

        compareShell(shell, ical);
      });

      it('should correctly create a card when birthday is not a Date', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          birthday: 'not sure about the birthday'
        };

        var vcard = VcardBuilder.toVcard(shell);
        var birthday = vcard.getFirstProperty('bday');
        expect(birthday.type).to.equal('text');
        expect(birthday.getFirstValue()).to.equal('not sure about the birthday');
      });

      it('should not add email in vcard when it does not have value', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          emails: [{ type: 'Home'}]
        };

        var vcard = VcardBuilder.toVcard(shell);
        var email = vcard.getFirstProperty('email');
        expect(email).is.null;
      });

      it('should not add telephone in vcard when it does not have value', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          tel: [{ type: 'Home'}]
        };

        var vcard = VcardBuilder.toVcard(shell);
        var tel = vcard.getFirstProperty('tel');
        expect(tel).is.null;
      });

      it('should not add addresse in vcard when it does not have value', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          addresses: [{ type: 'Home'}]
        };

        var vcard = VcardBuilder.toVcard(shell);
        var addresses = vcard.getFirstProperty('adr');
        expect(addresses).is.null;
      });

      it('should not add socialprofile in vcard when it does not have value', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          social: [{ type: 'Home'}]
        };

        var vcard = VcardBuilder.toVcard(shell);
        var social = vcard.getFirstProperty('socialprofile');
        expect(social).is.null;
      });

      it('should not add url in vcard when it does not have value', function() {
        var shell = {
          id: '00000000-0000-4000-a000-000000000000',
          urls: []
        };

        var vcard = VcardBuilder.toVcard(shell);
        var url = vcard.getFirstProperty('url');
        expect(url).is.null;
      });
    });

    describe('The toJSON function', function() {
      it('should build the vcard then call toJSON', function(done) {
        var shell = {foo: 'bar'};
        VcardBuilder.toVcard = function(_shell) {
          expect(_shell).to.deep.equal(shell);
          return {
            toJSON: done
          };
        };
        VcardBuilder.toJSON(shell);
      });
    });
  });
});
