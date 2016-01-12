'use strict';

angular.module('linagora.esn.contact')

  .run(function(AddressBookPaginationRegistry, AddressBookPaginationProvider, SearchAddressBookPaginationProvider, CONTACT_LIST_DISPLAY_MODES) {
    AddressBookPaginationRegistry.put(CONTACT_LIST_DISPLAY_MODES.list, AddressBookPaginationProvider);
    AddressBookPaginationRegistry.put(CONTACT_LIST_DISPLAY_MODES.search, SearchAddressBookPaginationProvider);
  })

  .factory('AddressBookPaginationProvider', function(ContactAPIClient, $log) {

    function AddressBookPaginationProvider(options) {
      this.addressbook = options.addressbooks[0];
      this.id = this.addressbook.id;
      this.name = this.addressbook.name;
      this.options = options;
      this.lastPage = false;
      this.nextPage = 0;
    }

    AddressBookPaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      var page = this.nextPage || 1;
      $log.debug('Load contacts page %s on ab', page, this.addressbook);

      return ContactAPIClient
        .addressbookHome(this.id)
        .addressbook(this.name)
        .vcard()
        .list({
          userId: this.options.user._id,
          page: page,
          paginate: true
        }).then(function(result) {
          self.lastPage = result.last_page;
          self.nextPage = result.next_page;
          return result;
        });
    };

    return AddressBookPaginationProvider;
  })

  .factory('SearchAddressBookPaginationProvider', function(ContactAPIClient, $log) {

    function SearchAddressBookPaginationProvider(options) {
      this.addressbook = options.addressbooks[0];
      this.id = this.addressbook.id;
      this.name = this.addressbook.name;
      this.options = options;
      this.totalHits = 0;
      this.lastPage = false;
      this.nextPage = 0;
    }

    SearchAddressBookPaginationProvider.prototype.loadNextItems = function(options) {
      var self = this;
      var page = this.currentPage || 1;
      $log.debug('Search contacts page %s on ab', page, this.addressbook);

      var query = {
        data: options.searchInput,
        userId: this.options.user._id,
        page: page
      };

      return ContactAPIClient
        .addressbookHome(this.id)
        .addressbook(this.name)
        .vcard()
        .search(query)
        .then(function(result) {
          self.currentPage = result.current_page;
          self.totalHits = self.totalHits + result.hits_list.length;
          self.nextPage = result.next_page;
          if (self.totalHits === result.total_hits) {
            self.lastPage = true;
          }
          result.last_page = self.lastPage;
          return result;
        });
    };

    return SearchAddressBookPaginationProvider;
  })

  .factory('ContactShellComparator', function() {

    function byDisplayName(contact1, contact2) {
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
        self.lastPage = result.last_page;
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
