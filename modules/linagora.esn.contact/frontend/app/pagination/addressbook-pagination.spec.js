'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The AddressBookPagination service', function() {
  var AddressBookPaginationRegistry, AddressBookPaginationService;
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
    AddressBookPaginationRegistry = {
      get: function() {},
      put: function() {}
    };

    AddressBookPaginationService = function() {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('AddressBookPaginationRegistry', AddressBookPaginationRegistry);
      $provide.value('AddressBookPaginationService', AddressBookPaginationService);
      $provide.value('ContactAPIClient', ContactAPIClient);
    });
  });

  beforeEach(function() {
    inject(function(AddressBookPagination, $rootScope) {
      this.$rootScope = $rootScope;
      this.AddressBookPagination = AddressBookPagination;
    });
  });

  describe('When instanciating', function() {
    it('should save the scope', function() {
      var scope = {foo: 'bar'};
      var pagination = new this.AddressBookPagination(scope);
      expect(pagination.scope).to.deep.equal(scope);
    });
  });

  describe('The init function', function() {
    it('should stop the watcher is defined', function(done) {
      var scope = {foo: 'bar'};
      var pagination = new this.AddressBookPagination(scope);
      pagination.lastPageWatcher = {
        stop: done
      };

      pagination.init();
      done(new Error());
    });

    it('should throw error when pagination provider does not exists', function() {
      var scope = {foo: 'bar'};
      var provider = 'list';
      AddressBookPaginationRegistry.get = function(type) {
        expect(type).to.equal(provider);
      };
      var pagination = new this.AddressBookPagination(scope);
      expect(pagination.init.bind(pagination, provider)).to.throw(/Unknown provider/);
    });

    it('should instanciate the provider, service and watcher', function() {
      var scope = {
        foo: 'bar',
        $watch: function() {
        }
      };
      var provider = 'list';
      var options = {addressbooks: []};

      function Mock(_options) {
        expect(_options).to.deep.equal(options);
      }

      AddressBookPaginationRegistry.get = function(type) {
        expect(type).to.equal(provider);
        return Mock;
      };
      AddressBookPaginationService = function(provider) {
        expect(provider).to.be.defined;
        expect(provider).to.be.a.function;
      };

      var pagination = new this.AddressBookPagination(scope);
      pagination.init(provider, options);

      expect(pagination.provider).to.be.a.function;
      expect(pagination.service).to.be.a.function;
      expect(pagination.lastPageWatcher).to.be.a.function;
    });
  });
});
