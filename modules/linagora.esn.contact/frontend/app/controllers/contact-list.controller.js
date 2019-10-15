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
    $window,
    session,
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
    user,
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
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = $stateParams.bookName;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = requiredKey;
    $scope.prefix = 'contact-index';
    $scope.categories = new AlphaCategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});
    $scope.displayAs = CONTACT_LIST_DISPLAY.list;
    $scope.addressbooks = [];

    $onInit();

    function $onInit() {
      var listAddressbooks;

      if ($scope.bookName && $scope.bookId) {
        listAddressbooks = contactAddressbookService.getAddressbookByBookName($scope.bookName, $scope.bookId);
      } else {
        listAddressbooks = contactAddressbookService.listAggregatedAddressbooks();
      }

      self.status = LOADING_STATUS.loading;
      listAddressbooks
        .then(function(addressbooks) {
          $scope.addressbooks = Array.isArray(addressbooks) ? addressbooks : [addressbooks];
          $scope.bookTitle = _buildAddressBookTitle();
          $scope.contactsCount = _getContactsCount();
          $scope.createPagination(CONTACT_LIST_DISPLAY_MODES.multiple);
          $scope.canCreateContact = $scope.addressbooks.some(function(addressbook) {
            return addressbook.canCreateContact;
          });

          $scope.scrollHandler = function() {
            $log.debug('Infinite Scroll down handler');
            $scope.loadContacts();
          };

          $scope.loadContacts();
        })
        .catch(function() {
          self.status = LOADING_STATUS.error;
        });
    }

    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.DELETED, _onAddressbookDeleted);
    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.SUBSCRIPTION_DELETED, _onAddressbookDeleted);

    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, function(evt, newAddressbook) {
      if ($scope.addressbooks.length === 1 && $scope.addressbooks[0].bookName === newAddressbook.bookName) {
        $scope.bookTitle = newAddressbook.name;
      }
    });

    function _onAddressbookDeleted(event, deletedAddressbook) {
      if ($scope.addressbooks.length === 1 && $scope.addressbooks[0].bookName === deletedAddressbook.bookName) {
        $state.go('contact.addressbooks', {
          bookId: 'all',
          bookName: null
        });
      }
      // Live update contact list in all contacts page on an address book deleting event
      if (_inAllContacts()) {
        _getContactIdsFromCategories(deletedAddressbook.bookId, deletedAddressbook.bookName)
          .forEach(function(contactId) {
            $scope.categories.removeItemWithId(contactId);
          });
      }
    }

    function _getContactIdsFromCategories(bookId, bookName) {
      var ids = [];
      var categories = $scope.categories.get();

      Object.keys(categories).forEach(function(key) {
        categories[key].forEach(function(contact) {
          if (contact.addressbook.bookId === bookId && contact.addressbook.bookName === bookName) {
            ids.push(contact.id);
          }
        });
      });

      return ids;
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

    function _getContactsCount() {
      if ($scope.addressbooks.length > 0) {
        return $scope.addressbooks.reduce(function(count, addressbook) {
          return addressbook.numberOfContacts ? count + addressbook.numberOfContacts : count;
        }, 0);
      }

      return 0;
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

    $scope.openContactCreation = function() {
      if ($scope.addressbooks.length > 1) {
        return openContactForm({
          bookId: session.user._id,
          bookName: DEFAULT_ADDRESSBOOK_NAME
        });
      }

      if ($scope.addressbooks.length === 1) {
        return openContactForm({
          bookId: $scope.addressbooks[0].bookId,
          bookName: $scope.addressbooks[0].bookName
        });
      }
    };

    function _inAllContacts() {
      return $scope.addressbooks.length > 1;
    }

    function _contactBelongsCurrentAddressbook(contact) {
      return contact.addressbook && $scope.addressbooks.length === 1 &&
             contact.addressbook.bookId === $scope.addressbooks[0].bookId &&
             contact.addressbook.bookName === $scope.addressbooks[0].bookName;
    }

    $scope.$on(CONTACT_EVENTS.CREATED, function(e, data) {
      if (_inAllContacts() || _contactBelongsCurrentAddressbook(data)) {
        addItemsToCategories([data]);
      }
    });

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if (contactUpdateDataService.contactUpdatedIds.indexOf(data.id) === -1) {
        contactUpdateDataService.contactUpdatedIds.push(data.id);
      }

      $scope.$applyAsync(function() {
        $scope.categories.replaceItem(fillRequiredContactInformation(data));
      });
    });

    $scope.$on(CONTACT_EVENTS.DELETED, function(e, contact) {
      $scope.categories.removeItemWithId(contact.id);
    });

    $scope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(e, data) {
      addItemsToCategories([data]);
    });

    $scope.$on('$destroy', function() {
      gracePeriodService.flushAllTasks();
      contactUpdateDataService.contactUpdatedIds = [];
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);

    function loadPageComplete() {
      $scope.loadingNextContacts = false;
      self.status = LOADING_STATUS.loaded;
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

    $scope.loadContacts = function() {
      updateScrollState().then(getNextContacts);
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
