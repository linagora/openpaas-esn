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

  describe('The AddressBookPaginationProvider service', function() {

    beforeEach(function() {
      module('linagora.esn.contact', function($provide) {
        $provide.value('ContactAPIClient', ContactAPIClient);
      });
    });

    beforeEach(angular.mock.inject(function(AddressBookPaginationProvider, $rootScope) {
      this.$rootScope = $rootScope;
      this.AddressBookPaginationProvider = AddressBookPaginationProvider;
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

    it('should set bookId and bookName to source addressbook if the addressbook is a subscription', function() {
      addressbook.isSubscription = true;
      addressbook.source = {
        bookId: 'sourceABid',
        bookName: 'source AB name'
      };

      var provider = new this.AddressBookPaginationProvider(options);

      expect(provider.bookId).to.equal('sourceABid');
      expect(provider.bookName).to.equal('source AB name');
    });

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

  describe('The MultipleAddressBookPaginationProvider service', function() {
    var PageAggregatorServiceMock;

    beforeEach(function() {
      PageAggregatorServiceMock = function() {};

      module('linagora.esn.contact', function($provide) {
        $provide.value('PageAggregatorService', PageAggregatorServiceMock);
      });
    });

    beforeEach(angular.mock.inject(function(MultipleAddressBookPaginationProvider, $rootScope) {
      this.$rootScope = $rootScope;
      this.MultipleAddressBookPaginationProvider = MultipleAddressBookPaginationProvider;
    }));

    it('should throw error when options.addressbooks is undefined', function(done) {
      try {
        new this.MultipleAddressBookPaginationProvider({});
        done(new Error());
      } catch (e) {
        expect(e.message).to.match(/options.addressbooks array is required/);
        done();
      }
    });

    it('should throw error when options.addressbooks is empty', function(done) {
      try {
        new this.MultipleAddressBookPaginationProvider({
          addressbooks: []
        });
        done(new Error());
      } catch (e) {
        expect(e.message).to.match(/options.addressbooks array is required/);
        done();
      }
    });

    it('should create all the required resources', function() {
      var options = {
        addressbooks: [{ id: 1 }, { id: 2 }, { id: 3 }]
      };

      var provider = new this.MultipleAddressBookPaginationProvider(options);
      expect(provider.providers.length).to.equal(options.addressbooks.length);
      expect(provider.aggregator).to.be.defined;
    });

    it('should use the options comparator when defined', function() {
      var options = {
        addressbooks: [{ id: 1 }, { id: 2 }, { id: 3 }],
        compare: 'MyAwesomeComparator'
      };

      var provider = new this.MultipleAddressBookPaginationProvider(options);
      expect(provider.compare).to.equal(options.compare);
    });

    describe('The loadNextItems function', function() {
      it('should call the age aggregator service', function(done) {
        var options = {
          addressbooks: [{ id: 1 }, { id: 2 }, { id: 3 }]
        };

        PageAggregatorServiceMock.prototype.loadNextItems = done;
        var provider = new this.MultipleAddressBookPaginationProvider(options);
        provider.loadNextItems();
        done(new Error());
      });
    });
  });

  describe('The SearchAddressBookPaginationProvider service', function() {

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

  describe('The AddressBookPaginationService service', function() {

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

  describe('The AddressBookPaginationRegistry service', function() {
    beforeEach(function() {
      module('linagora.esn.contact', function($provide) {
        $provide.value('ContactAPIClient', ContactAPIClient);
      });
    });

    beforeEach(function() {
      inject(function(AddressBookPaginationRegistry, $rootScope) {
        this.$rootScope = $rootScope;
        this.AddressBookPaginationRegistry = AddressBookPaginationRegistry;
      });
    });

    it('should send back the stored provider', function() {
      var type = 'foo';
      var value = 'bar';
      this.AddressBookPaginationRegistry.put(type, value);
      expect(this.AddressBookPaginationRegistry.get(type)).to.equal(value);
    });
  });

  describe('The AddressBookPagination service', function() {
    var AddressBookPaginationRegistry, AddressBookPaginationService;

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
          console.log(provider);
        };

        var pagination = new this.AddressBookPagination(scope);
        pagination.init(provider, options);

        expect(pagination.provider).to.be.a.function;
        expect(pagination.service).to.be.a.function;
        expect(pagination.lastPageWatcher).to.be.a.function;
      });
    });
  });

  describe('The ContactShellComparator service', function() {

    beforeEach(function() {
      module('linagora.esn.contact');
    });

    beforeEach(function() {
      inject(function(ContactShellComparator, $rootScope) {
        this.$rootScope = $rootScope;
        this.ContactShellComparator = ContactShellComparator;
      });
    });

    describe('The byDisplayName function', function() {

      var a = {
        displayName: 'Aa'
      };
      var b = {
        displayName: 'Abc'
      };

      var nonAlpha = {
        displayName: '#'
      };

      var thunder = {
        displayName: '⌁ YOLO ⌁'
      };

      var number = {
        displayName: '1'
      };

      var anonymousUser = {};

      it('should send back 1st contact when second param  does not have displayName attribute', function() {
        expect(this.ContactShellComparator.byDisplayName(a, anonymousUser)).to.equal(1);
      });

      it('should send back 2nd contact when first param  does not have displayName attribute', function() {
        expect(this.ContactShellComparator.byDisplayName(anonymousUser, b)).to.equal(-1);
      });

      it('should send back 1st when both params do not have displayName attribute', function() {
        expect(this.ContactShellComparator.byDisplayName(anonymousUser, anonymousUser)).to.equal(0);
      });

      it('should send back 1st contact when its fn is smaller', function() {
        expect(this.ContactShellComparator.byDisplayName(a, b)).to.equal(-1);
      });

      it('should send back 2nd contact when its fn is smaller', function() {
        expect(this.ContactShellComparator.byDisplayName(b, a)).to.equal(1);
      });

      it('should send back the first contact when fn are equal', function() {
        expect(this.ContactShellComparator.byDisplayName(a, a)).to.equal(0);
      });

      it('should send back non alpha one as the smaller', function() {
        expect(this.ContactShellComparator.byDisplayName(nonAlpha, a)).to.equal(-1);
        expect(this.ContactShellComparator.byDisplayName(thunder, a)).to.equal(-1);
      });

      it('should send equal when both are non alpha', function() {
        expect(this.ContactShellComparator.byDisplayName(nonAlpha, thunder)).to.equal(0);
      });

      it('should send number as smaller than alpha', function() {
        expect(this.ContactShellComparator.byDisplayName(number, a)).to.equal(-1);
      });

      it('should send equal between number and non alpha', function() {
        expect(this.ContactShellComparator.byDisplayName(number, nonAlpha)).to.equal(0);
      });
    });
  });
});
