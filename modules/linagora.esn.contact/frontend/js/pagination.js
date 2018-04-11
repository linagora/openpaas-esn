'use strict';

angular.module('linagora.esn.contact')

  .run(function(AddressBookPaginationRegistry, AddressBookPaginationProvider, SearchAddressBookPaginationProvider, MultipleAddressBookPaginationProvider, CONTACT_LIST_DISPLAY_MODES) {
    AddressBookPaginationRegistry.put(CONTACT_LIST_DISPLAY_MODES.single, AddressBookPaginationProvider);
    AddressBookPaginationRegistry.put(CONTACT_LIST_DISPLAY_MODES.search, SearchAddressBookPaginationProvider);
    AddressBookPaginationRegistry.put(CONTACT_LIST_DISPLAY_MODES.multiple, MultipleAddressBookPaginationProvider);
  })

  .factory('MultipleAddressBookPaginationProvider', function(PageAggregatorService, AddressBookPaginationProvider, ContactShellComparator, DEFAULT_ADDRESSBOOK_AGGREGATOR_NAME, CONTACT_LIST_PAGE_SIZE, $log) {

    function MultipleAddressBookPaginationProvider(options) {
      this.options = options;
      this.addressbooks = this.options.addressbooks;
      this.compare = this.options.compare || ContactShellComparator.byDisplayName;

      if (!this.options.addressbooks || this.options.addressbooks.length === 0) {
        throw new Error('options.addressbooks array is required');
      }
      var self = this;

      this.id = options.id || DEFAULT_ADDRESSBOOK_AGGREGATOR_NAME;
      this.providers = this.addressbooks.map(function(addressbook) {
        return new AddressBookPaginationProvider({addressbooks: [addressbook], user: self.options.user});
      });
      this.aggregator = new PageAggregatorService(this.id, this.providers, {
        compare: this.compare,
        results_per_page: CONTACT_LIST_PAGE_SIZE
      });
    }

    MultipleAddressBookPaginationProvider.prototype.loadNextItems = function() {
      $log.debug('Loading next items on aggregator');
      return this.aggregator.loadNextItems();
    };

    return MultipleAddressBookPaginationProvider;
  })

  .factory('AddressBookPaginationProvider', function(ContactAPIClient, $log) {

    function AddressBookPaginationProvider(options) {
      this.options = options;

      if (!this.options.addressbooks || this.options.addressbooks.length === 0) {
        throw new Error('options.addressbooks array is required');
      }

      this.addressbook = this.options.addressbooks[0];
      this.lastPage = false;
      this.nextPage = 0;

      if (this.addressbook.isSubscription) {
        this.bookId = this.addressbook.source.bookId;
        this.bookName = this.addressbook.source.bookName;
      } else {
        this.bookId = this.addressbook.bookId;
        this.bookName = this.addressbook.bookName;
      }
    }

    AddressBookPaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      var page = this.nextPage || 1;
      $log.debug('Load contacts page %s on ab', page, this.addressbook);

      return ContactAPIClient
        .addressbookHome(this.bookId)
        .addressbook(this.bookName)
        .vcard()
        .list({
          userId: this.options.user._id,
          page: page,
          paginate: true
        }).then(function(result) {
          self.lastPage = result.last_page;
          result.lastPage = result.last_page;
          self.nextPage = result.next_page;
          return result;
        });
    };

    return AddressBookPaginationProvider;
  })

  .factory('SearchAddressBookPaginationProvider', function($log, ContactAPIClient) {

    function SearchAddressBookPaginationProvider(options) {
      this.options = options;
      this.user = this.options.user;
      this.bookId = this.user._id;
      this.totalHits = 0;
      this.lastPage = false;
      this.nextPage = 0;
    }

    SearchAddressBookPaginationProvider.prototype.loadNextItems = function(options) {
      var self = this;
      var page = this.nextPage || 1;
      $log.debug('Search contacts page %s for bookId %s', page, this.bookId);

      var query = {
        data: options.searchInput,
        userId: this.options.user._id,
        page: page
      };

      return ContactAPIClient
        .addressbookHome(this.bookId)
        .search(query)
        .then(function(result) {
          self.currentPage = result.current_page;
          self.totalHits = self.totalHits + result.data.length;
          self.nextPage = result.next_page;
          if (self.totalHits === result.total_hits) {
            self.lastPage = true;
          }
          result.lastPage = self.lastPage;
          return result;
        });
    };

    return SearchAddressBookPaginationProvider;
  })

  .factory('ContactShellComparator', function() {

    function getAsAlpha(str) {
      return (str && /^[ a-z]+$/i.test(str)) ? str.toLowerCase() : '#';
    }

    function byDisplayName(contact1, contact2) {
      var valueA = getAsAlpha(contact1.displayName);
      var valueB = getAsAlpha(contact2.displayName);

      if (valueA < valueB) {
        return -1;
      }

      if (valueA > valueB) {
        return 1;
      }

      return 0;
    }

    return {
      byDisplayName: byDisplayName
    };
  })

  .factory('AddressBookPaginationService', function() {

    function AddressBookPaginationService(provider) {
      this.provider = provider;
      this.lastPage = false;
    }

    AddressBookPaginationService.prototype.loadNextItems = function(options) {
      var self = this;
      return this.provider.loadNextItems(options).then(function(result) {
        self.lastPage = result.lastPage;
        return result;
      });
    };

    return AddressBookPaginationService;
  })

  .factory('AddressBookPaginationRegistry', function() {

    var providers = {};

    function put(type, provider) {
      providers[type] = provider;
    }

    function get(type) {
      return providers[type];
    }

    return {
      put: put,
      get: get
    };
  })

  .factory('AddressBookPagination', function(AddressBookPaginationService, AddressBookPaginationRegistry) {

    function AddressBookPagination(scope) {
      this.scope = scope;
    }

    AddressBookPagination.prototype.init = function(provider, options) {
      if (this.lastPageWatcher) {
        this.lastPageWatcher.stop();
      }
      var PaginationProvider = AddressBookPaginationRegistry.get(provider);
      if (!PaginationProvider) {
        throw new Error('Unknown provider ' + provider);
      }

      this.provider = new PaginationProvider(options);
      this.service = new AddressBookPaginationService(this.provider);
      this.lastPageWatcher = new LastPageWatcher(this.scope, this.service);
    };

    function LastPageWatcher(scope, addressBookPaginationService) {
      var self = this;
      this.scope = scope;
      this.scope.lastPage = false;
      this.addressBookPaginationService = addressBookPaginationService;

      this.unbindWatch = scope.$watch(function() {
        return self.addressBookPaginationService.lastPage;
      }, function(newVal, oldVal) {
        if (newVal !== oldVal) {
          self.scope.lastPage = newVal;
        }

        if (self.scope.lastPage) {
          self.unbindWatch();
        }
      });
    }

    LastPageWatcher.prototype.stop = function() {
      this.unbindWatch();
    };

    return AddressBookPagination;
  });
