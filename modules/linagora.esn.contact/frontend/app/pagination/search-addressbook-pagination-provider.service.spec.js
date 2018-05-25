'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The SearchAddressBookPaginationProvider service', function() {

  var options, user, addressbook, ContactAPIClient, listMock, searchMock;

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

  beforeEach(function() {
    inject(function(SearchAddressBookPaginationProvider, $rootScope) {
      this.$rootScope = $rootScope;
      this.SearchAddressBookPaginationProvider = SearchAddressBookPaginationProvider;
    });
  });

  describe('The loadNextItems function', function() {
    it('should call ContactAPIClient api with right parameters', function(done) {
      var nextPage = 'nextPage';
      var currentPage = 'currentPage';
      var hitlist = [1, 2, 3];
      var totalHits = 4;
      var search = 'SearchMe';

      searchMock = function(query) {
        expect(query).to.deep.equal({userId: user._id, page: 1, data: search});
        return $q.when({current_page: currentPage, data: hitlist, next_page: nextPage, total_hits: totalHits});
      };
      var provider = new this.SearchAddressBookPaginationProvider(options);

      provider.loadNextItems({searchInput: search}).then(function() {
        expect(provider.currentPage).to.equal(currentPage);
        expect(provider.totalHits).to.equal(hitlist.length);
        expect(provider.nextPage).to.equal(nextPage);
        expect(provider.lastPage).to.be.false;
        done();
      }, done);
      this.$rootScope.$apply();
    });

    it('should set lastPage when end reached', function(done) {
      var nextPage = 'nextPage';
      var currentPage = 'currentPage';
      var hitlist = [1, 2, 3, 4];
      var totalHits = 4;
      var search = 'SearchMe';

      searchMock = function(query) {
        expect(query).to.deep.equal({userId: user._id, page: 1, data: search});
        return $q.when({current_page: currentPage, data: hitlist, next_page: nextPage, total_hits: totalHits});
      };
      var provider = new this.SearchAddressBookPaginationProvider(options);

      provider.loadNextItems({searchInput: search}).then(function() {
        expect(provider.lastPage).to.be.true;
        done();
      }, done);
      this.$rootScope.$apply();
    });
  });
});
