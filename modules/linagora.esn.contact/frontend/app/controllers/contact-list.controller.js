(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('ContactListController', ContactListController);

  function ContactListController(
    $q,
    $log,
    $scope,
    $state,
    $stateParams,
    $location,
    $window,
    AddressBookPagination,
    AlphaCategoryService,
    ContactsHelper,
    contactUpdateDataService,
    contactAddressbookDisplayService,
    contactAddressbookService,
    esnI18nService,
    contactDisplayError,
    gracePeriodService,
    openContactForm,
    esnSearchResultSizeFormatter,
    sharedContactDataService,
    user,
    usSpinnerService,
    ALPHA_ITEMS,
    CONTACT_EVENTS,
    CONTACT_LIST_DISPLAY,
    CONTACT_LIST_DISPLAY_MODES,
    DEFAULT_ADDRESSBOOK_NAME,
    CONTACT_ADDRESSBOOK_EVENTS
  ) {
    var self = this;
    var LOADING_STATUS = {
      loading: 'loading',
      loaded: 'loaded',
      error: 'error'
    };
    var requiredKey = 'displayName';

    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.bookName = $stateParams.bookName;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = requiredKey;
    $scope.prefix = 'contact-index';
    $scope.contactSearch = {};
    $scope.searchResult = {};
    $scope.updatedDuringSearch = null;
    $scope.categories = new AlphaCategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});
    $scope.searchFailure = false;
    $scope.totalHits = 0;
    $scope.displayAs = CONTACT_LIST_DISPLAY.list;
    $scope.addressbooks = [];

    $onInit();

    function $onInit() {
      var listAddressbooks;

      if ($scope.bookName) {
        listAddressbooks = contactAddressbookService.getAddressbookByBookName($scope.bookName);
      } else {
        listAddressbooks = contactAddressbookService.listAggregatedAddressbooks();
      }

      self.status = LOADING_STATUS.loading;
      listAddressbooks
        .then(function(addressbooks) {
          $scope.addressbooks = Array.isArray(addressbooks) ? addressbooks : [addressbooks];
          $scope.bookTitle = _buildAddressBookTitle();
          $scope.createPagination(CONTACT_LIST_DISPLAY_MODES.multiple);
          $scope.canCreateContact = $scope.addressbooks.some(function(addressbook) {
            return addressbook.canCreateContact;
          });

          $scope.scrollHandler = function() {
            $log.debug('Infinite Scroll down handler');
            if ($scope.contactSearch.searchInput) {
              return scrollSearchHandler();
            }
            $scope.loadContacts();
          };

          if ($location.search().q) {
            $scope.contactSearch.searchInput = $location.search().q.replace(/\+/g, ' ');
            $scope.search();
          } else if (sharedContactDataService.searchQuery) {
            $location.search('q', sharedContactDataService.searchQuery.replace(/ /g, '+'));
          } else {
            $scope.contactSearch.searchInput = null;
            $scope.loadContacts();
          }
        })
        .catch(function() {
          self.status = LOADING_STATUS.error;
        });
    }

    $scope.$on('$stateChangeStart', function(evt, next) {
      // store the search query so the search list can be restored when the user
      // switches back to contacts list
      if (next.name === '/contact/show/:bookId/:bookName/:cardId' ||
          next.name === '/contact/edit/:bookId/:bookName/:cardId') {
        sharedContactDataService.searchQuery = $scope.contactSearch.searchInput;
      } else {
        sharedContactDataService.searchQuery = null;
      }
    });

    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.DELETED, _onAddressbookDeleted);
    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, _onAddressbookDeleted);

    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, function(evt, newAddressbook) {
      if ($scope.addressbooks.length === 1 && $scope.addressbooks[0].bookName === newAddressbook.bookName) {
        $scope.bookTitle = newAddressbook.name;
      }
    });

    function _onAddressbookDeleted(event, deletedAddressbook) {
      if ($scope.addressbooks.length === 1 && $scope.addressbooks[0].bookName === deletedAddressbook.bookName) {
        $state.go('contact.addressbooks', { bookName: null });
      }
    }

    function _buildAddressBookTitle() {
      if ($scope.addressbooks.length > 1) {
        return esnI18nService.translate('All contacts').toString();
      }

      if ($scope.addressbooks.length === 1) {
        return contactAddressbookDisplayService.buildDisplayName($scope.addressbooks[0]);
      }

      return '';
    }

    function fillRequiredContactInformation(contact) {
      if (!contact[requiredKey]) {
        var fn = ContactsHelper.getFormattedName(contact);

        if (!fn) {
          fn = contact.id;
        }
        contact[requiredKey] = fn;
      }

      return contact;
    }

    function addItemsToCategories(data) {
      return $q(function(resolve) {
        $scope.$applyAsync(function() {
          data = data.map(fillRequiredContactInformation);
          $scope.categories.addItems(data);
          $scope.sorted_contacts = $scope.categories.get();

          resolve();
        });
      });
    }

    function cleanCategories() {
      $scope.categories.init();
      delete $scope.sorted_contacts;
    }

    function setSearchResults(data) {
      $scope.searchResult.data = ($scope.searchResult.data) ? $scope.searchResult.data.concat(data.data) : data.data;
      $scope.searchResult.count = data.total_hits || 0;
      $scope.searchResult.formattedResultsCount = esnSearchResultSizeFormatter($scope.searchResult.count);
    }

    function cleanSearchResults() {
      $scope.searchFailure = false;
      $scope.searchResult = {};
      $scope.totalHits = 0;
    }

    $scope.openContactCreation = function() {
      if ($scope.addressbooks.length > 1) {
        return openContactForm($scope.bookId, DEFAULT_ADDRESSBOOK_NAME);
      }

      if ($scope.addressbooks.length === 1) {
        return openContactForm($scope.bookId, $scope.addressbooks[0].bookName);
      }
    };

    function _inAllContacts() {
      return $scope.addressbooks.length > 1;
    }

    function _contactBelongsCurrentAddressbook(contact) {
      return contact.addressbook && $scope.addressbooks.length === 1 &&
             contact.addressbook.bookName === $scope.addressbooks[0].bookName;
    }

    $scope.$on(CONTACT_EVENTS.CREATED, function(e, data) {
      if ($scope.contactSearch.searchInput) { return; }

      if (_inAllContacts() || _contactBelongsCurrentAddressbook(data)) {
        addItemsToCategories([data]);
      }
    });

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if (contactUpdateDataService.contactUpdatedIds.indexOf(data.id) === -1) {
        contactUpdateDataService.contactUpdatedIds.push(data.id);
      }
      if ($scope.contactSearch.searchInput) { return; }

      $scope.$applyAsync(function() {
        $scope.categories.replaceItem(fillRequiredContactInformation(data));
      });
    });

    $scope.$on(CONTACT_EVENTS.DELETED, function(e, contact) {
      if ($scope.contactSearch.searchInput) {
        contact.deleted = true;
      } else {
        $scope.categories.removeItemWithId(contact.id);
      }
    });

    $scope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(e, data) {
      if ($scope.contactSearch.searchInput) {
        data.deleted = false;
      } else {
        addItemsToCategories([data]);
      }
    });

    $scope.$on('$destroy', function() {
      gracePeriodService.flushAllTasks();
      contactUpdateDataService.contactUpdatedIds = [];
    });

    $scope.$on('$stateChangeSuccess', function() {
      if (!$location.search().q) {
        if (!$scope.contactSearch.searchInput) {return;}
        $scope.contactSearch.searchInput = null;

        return $scope.search();
      }
      if ($location.search().q.replace(/\+/g, ' ') !== $scope.contactSearch.searchInput) {
        $scope.contactSearch.searchInput = $location.search().q.replace(/\+/g, ' ');

        return $scope.search();
      }
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);

    $scope.appendQueryToURL = function() {
      if ($scope.contactSearch.searchInput) {
        $location.search('q', $scope.contactSearch.searchInput.replace(/ /g, '+'));

        return;
      }
      $location.search('q', null);
    };

    function searchFailure(err) {
      $log.error('Can not search contacts', err);
      contactDisplayError('Can not search contacts');
      $scope.searchFailure = true;
    }

    function loadPageComplete() {
      $scope.loadingNextContacts = false;
      self.status = LOADING_STATUS.loaded;
    }

    function switchToList() {
      cleanSearchResults();
      $scope.createPagination(CONTACT_LIST_DISPLAY_MODES.multiple);
      $scope.loadContacts();
    }

    $scope.search = function() {

      if ($scope.searching) {
        $scope.updatedDuringSearch = $scope.contactSearch.searchInput;

        return;
      }

      $scope.appendQueryToURL();
      cleanSearchResults();
      cleanCategories();
      if (!$scope.contactSearch.searchInput) {
        return switchToList();
      }

      $scope.createPagination(CONTACT_LIST_DISPLAY_MODES.search);
      $scope.searching = true;
      $scope.updatedDuringSearch = null;
      $scope.searchFailure = false;
      $scope.loadingNextContacts = true;
      getSearchResults().finally(function() {
        $scope.searching = false;
        if ($scope.updatedDuringSearch !== null) {
          $scope.search();
        }
      });
    };

    function getSearchResults() {
      $log.debug('Searching contacts');
      self.status = LOADING_STATUS.loading;

      return $scope.pagination.service.loadNextItems({searchInput: $scope.contactSearch.searchInput})
        .then(setSearchResults, searchFailure)
        .finally(loadPageComplete);
    }

    function getNextContacts() {
      self.status = LOADING_STATUS.loading;
      $scope.pagination.service.loadNextItems().then(function(result) {
        return addItemsToCategories(result.data);
      }, function(err) {
        $log.error('Can not get contacts', err);
        contactDisplayError('Can not get contacts');
      }).finally(loadPageComplete);
    }

    function updateScrollState() {
      if ($scope.loadingNextContacts) {
        return $q.reject();
      }
      $scope.loadFailure = false;
      $scope.loadingNextContacts = true;

      return $q.when();
    }

    function ongoingScroll() {
      $log.debug('Scroll search is already ongoing');
    }

    function scrollSearchHandler() {
      updateScrollState().then(getSearchResults, ongoingScroll);
    }

    $scope.loadContacts = function() {
      updateScrollState().then(getNextContacts, ongoingScroll);
    };

    $scope.clearSearchInput = function() {
      $scope.contactSearch.searchInput = null;
      $scope.appendQueryToURL();
      switchToList();
    };

    $scope.createPagination = function(mode) {
      $scope.mode = mode;
      if (!$scope.pagination) {
        $scope.pagination = new AddressBookPagination($scope);
      }

      $scope.pagination.init($scope.mode, {
        user: $scope.user,
        addressbooks: $scope.addressbooks
      });
    };
  }
})(angular);
