'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactShellBuilder service', function() {

  var contactAvatarService, ContactShellHelper, contactUpdateDataService;
  var CARD_ID = 'mycardid';
  var BOOK_ID = '123456789';
  var BOOK_NAME = 'contacts';
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
      var self = this;
      var contacts = [{
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact1.vcf'
      }, {
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact2.vcf'
      }];
      var items = [{
        _links: {
          self: {
            href: contacts[0].href
          }
        }
      }, {
        _links: {
          self: {
            href: contacts[1].href
          }
        }
      }];

      self.ContactShellBuilder.fromVcard = sinon.spy(function(vcard) {
        return vcard;
      });
      ContactShellHelper.getMetadata = sinon.spy(function(href) {
        if (href === contacts[0].href) {
          return contacts[0];
        }

        return contacts[1];
      });
      self.ContactShellBuilder.populateAddressbook = sinon.spy();

      self.ContactShellBuilder.fromCardListResponse({data: {_embedded: {'dav:item': items}}}).then(function(result) {
        expect(result.length).to.equal(items.length);
        expect(ContactShellHelper.getMetadata).to.have.been.calledTwice;
        expect(self.ContactShellBuilder.populateAddressbook).to.have.been.calledTwice;
        done();
      });
      self.$rootScope.$apply();
    });
  });

  describe('The fromCardSearchResponse function', function() {

    function expectEmpty(done) {
      return function(data) {
        expect(data).to.deep.equal([]);
        done();
      };
    }

    it('should resolve with empty array when input is undefined', function(done) {
      this.ContactShellBuilder.fromCardSearchResponse().then(expectEmpty(done));
      this.$rootScope.$apply();
    });

    it('should resolve with empty array when input.data is undefined', function(done) {
      this.ContactShellBuilder.fromCardSearchResponse({}).then(expectEmpty(done));
      this.$rootScope.$apply();
    });

    it('should resolve with empty array when input.data._embedded is undefined', function(done) {
      this.ContactShellBuilder.fromCardSearchResponse({data: {}}).then(expectEmpty(done));
      this.$rootScope.$apply();
    });

    it('should resolve with empty array when input.data._embedded["dav:item"]', function(done) {
      this.ContactShellBuilder.fromCardSearchResponse({data: {_embedded: {}}}).then(expectEmpty(done));
      this.$rootScope.$apply();
    });

    it('should resolve with empty array when input.data._embedded["dav:item"] is empty', function(done) {
      this.ContactShellBuilder.fromCardSearchResponse({data: {_embedded: {'dav:item': []}}}).then(expectEmpty(done));
      this.$rootScope.$apply();
    });

    it('should not build the shell for dav items which have vcard is null', function(done) {
      var self = this;
      var contact = {
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact1.vcf'
      };
      var items = [
        {
          _links: {
            self: {
              href: contact.href
            }
          },
          data: {
            foo: 'bar'
          }
        },
        null
      ];
      var response = {
        data: {
          _embedded: {
            'dav:item': items
          }
        }
      };

      self.ContactShellBuilder.fromVcard = sinon.spy(function(vcard) {
        return vcard;
      });
      ContactShellHelper.getMetadata = sinon.spy();

      self.ContactShellBuilder.fromCardSearchResponse(response).then(function(result) {
        expect(ContactShellHelper.getMetadata).to.have.been.calledOnce;
        expect(ContactShellHelper.getMetadata).to.have.been.calledWith(contact.href);
        expect(result.length).to.equal(1);
        expect(result[0]).to.deep.equal(items[0].data);
        done();
      });
      self.$rootScope.$apply();
    });

    it('should build the shell for all dav items which have vcard data', function(done) {
      var self = this;
      var contacts = [{
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact1.vcf'
      }, {
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact2.vcf'
      }];
      var items = [{
        _links: {
          self: {
            href: contacts[0].href
          }
        },
        data: {}
      }, {
        _links: {
          self: {
            href: contacts[1].href
          }
        }
      }];

      self.ContactShellBuilder.fromVcard = sinon.spy(function(vcard) {
        return vcard;
      });
      ContactShellHelper.getMetadata = sinon.spy();

      self.ContactShellBuilder.fromCardSearchResponse({data: {_embedded: {'dav:item': items}}}).then(function(result) {
        expect(result.length).to.equal(1);
        expect(ContactShellHelper.getMetadata).to.have.been.calledOnce;
        done();
      });
      self.$rootScope.$apply();
    });

    it('should build the shell for all dav items', function(done) {
      var self = this;
      var contacts = [{
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact1.vcf'
      }, {
        bookId: '123',
        bookName: '456',
        href: 'addressbooks/123/456/contact2.vcf'
      }, {
        bookId: 'sourceId',
        bookName: 'sourceName'
      }];
      var items = [{
        _links: {
          self: {
            href: contacts[0].href
          }
        },
        'openpaas:addressbook': {
          bookHome: contacts[1].bookId,
          bookName: contacts[1].bookName
        },
        data: {}
      }, {
        _links: {
          self: {
            href: contacts[1].href
          }
        },
        data: {}
      }];

      self.ContactShellBuilder.fromVcard = sinon.spy(function(vcard) {
        return vcard;
      });
      ContactShellHelper.getMetadata = sinon.spy(function(href) {
        if (href === contacts[1].href) {
          return contacts[1];
        }
      });
      self.ContactShellBuilder.populateAddressbook = sinon.spy(function(contactShell) {
        return contactShell;
      });

      self.ContactShellBuilder.fromCardSearchResponse({data: {_embedded: {'dav:item': items}}}).then(function(result) {
        expect(result.length).to.equal(items.length);
        expect(ContactShellHelper.getMetadata).to.have.been.calledOnce;
        expect(self.ContactShellBuilder.populateAddressbook).to.have.been.calledTwice;
        done();
      });
      self.$rootScope.$apply();
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
