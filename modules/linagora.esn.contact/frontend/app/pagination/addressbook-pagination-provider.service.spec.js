'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The AddressBookPaginationProvider service', function() {
  var options, user, addressbook, ContactAPIClient, listMock, searchMock, contactService;

  beforeEach(function() {
    user = {
      _id: 123
    };
    addressbook = {
      id: 'MyABookId',
      name: 'MyABookName'
    };
    options = {
      addressbooks: [addressbook],
      user: user
    };

    ContactAPIClient = {
      addressbookHome: function() {
        return {
          search: searchMock,
          addressbook: function() {
            return {
              vcard: function() {
                return {
                  get: function() { return $q.when(); },
                  list: listMock,
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
  });

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('ContactAPIClient', ContactAPIClient);
    });
  });

  beforeEach(angular.mock.inject(function(AddressBookPaginationProvider, $rootScope, _contactService_) {
    this.$rootScope = $rootScope;
    this.AddressBookPaginationProvider = AddressBookPaginationProvider;
    contactService = _contactService_;
  }));

  it('should throw error when options.addressbooks is undefined', function(done) {
    try {
      new this.AddressBookPaginationProvider({});
      done(new Error());
    } catch (e) {
      expect(e.message).to.match(/options.addressbooks array is required/);
      done();
    }
  });

  it('should throw error when options.addressbooks is empty', function(done) {
    try {
      new this.AddressBookPaginationProvider({
        addressbooks: []
      });
      done(new Error());
    } catch (e) {
      expect(e.message).to.match(/options.addressbooks array is required/);
      done();
    }
  });

  describe('The loadNextItems function', function() {
    it('should call contactService.listContacts with right parameters and set state on result', function(done) {
      var nextPage = 'nextPage';
      var lastPage = 'lastPage';
      var data = [1, 2, 3];

      contactService.listContacts = function(addressbook, query) {
        expect(addressbook.bookId).to.equal(options.bookId);
        expect(addressbook.bookName).to.equal(options.bookName);
        expect(query).to.deep.equal({userId: user._id, page: 1, paginate: true});

        return $q.when({next_page: nextPage, last_page: lastPage, data: data});
      };

      var provider = new this.AddressBookPaginationProvider(options);

      provider.loadNextItems().then(function() {
        expect(provider.lastPage).to.equal(lastPage);
        expect(provider.nextPage).to.equal(nextPage);
        done();
      }, done);
      this.$rootScope.$apply();
    });
  });
});
