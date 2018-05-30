'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The AddressBookPaginationService service', function() {

  var ContactAPIClient, listMock, searchMock;

  beforeEach(function() {
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
          return $q.when({lastPage: lastPage});
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
