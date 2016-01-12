'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular pagination module', function() {

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
      addressbook: addressbook,
      user: user
    };

    ContactAPIClient = {
      addressbookHome: function() {
        return {
          addressbook: function() {
            return {
              vcard: function() {
                return {
                  get: function() { return $q.when(); },
                  list: listMock,
                  search: searchMock,
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

    module('linagora.esn.contact', function($provide) {
      $provide.value('ContactAPIClient', ContactAPIClient);
    });

  });

  describe('The AddressBookPaginationProvider service', function() {

    beforeEach(angular.mock.inject(function(AddressBookPaginationProvider, $rootScope) {
      this.$rootScope = $rootScope;
      this.AddressBookPaginationProvider = AddressBookPaginationProvider;
    }));

    describe('The loadNextItems function', function() {
      it('should call ContactAPIClient api with right parameters and set state on result', function(done) {
        var nextPage = 'nextPage';
        var lastPage = 'lastPage';
        var data = [1, 2, 3];

        listMock = function(query) {
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

  describe('The SearchAddressBookPaginationProvider service', function() {

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
          return $q.when({current_page: currentPage, hits_list: hitlist, next_page: nextPage, total_hits: totalHits});
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

      it('should set last_page when end reached', function(done) {
        var nextPage = 'nextPage';
        var currentPage = 'currentPage';
        var hitlist = [1, 2, 3, 4];
        var totalHits = 4;
        var search = 'SearchMe';

        searchMock = function(query) {
          expect(query).to.deep.equal({userId: user._id, page: 1, data: search});
          return $q.when({current_page: currentPage, hits_list: hitlist, next_page: nextPage, total_hits: totalHits});
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

  describe('The AddressBookPaginationService service', function() {

    beforeEach(angular.mock.inject(function(AddressBookPaginationService, $rootScope) {
      this.$rootScope = $rootScope;
      this.AddressBookPaginationService = AddressBookPaginationService;
    }));

    describe('The loadNextItems function', function() {
      it('should call paginable and set the lastPage value from result', function(done) {

        var lastPage = 'lastPage';
        var options = {
          foo: 'bar'
        };

        var paginable = {
          loadNextItems: function(_options) {
            expect(_options).to.deep.equal(options);
            return $q.when({last_page: lastPage});
          }
        };

        var service = new this.AddressBookPaginationService(paginable);
        service.loadNextItems(options).then(function() {
          expect(service.lastPage).to.deep.equal(lastPage);
          done();
        }, done);
        this.$rootScope.$apply();
      });
    });
  });

  describe('The ContactShellComparator service', function() {

    beforeEach(function() {
      inject(function(AddressBookPaginationProvider, $rootScope) {
        this.$rootScope = $rootScope;
        this.AddressBookPaginationProvider = AddressBookPaginationProvider;
      });
    });

    describe('The byDisplayName function', function() {

      it('should send back 1st contact when its fn is smaller', function(done) {
        done();
      });

      it('should send back 2nd contact when its fn is smaller', function(done) {
        done();
      });

      it('should send back the first contact when fn are equal', function(done) {
        done();
      });
    });
  });
});
