
'use strict';

angular.module('linagora.esn.contact')

  .controller('newContactController', function(
    $rootScope,
    $scope,
    $stateParams,
    $location,
    $state,
    $q,
    notificationFactory,
    sendContactToBackend,
    gracePeriodService,
    openContactForm,
    sharedContactDataService,
    contactService,
    ContactLocationHelper,
    esnI18nService,
    DEFAULT_ADDRESSBOOK_NAME
  ) {
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = $stateParams.bookName || DEFAULT_ADDRESSBOOK_NAME;
    $scope.contact = sharedContactDataService.contact;

    $scope.accept = function() {
      return sendContactToBackend($scope, function() {
        return contactService.createContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.contact)
          .then(null, function(err) {
            notificationFactory.weakError(
              'Contact creation',
              err && err.message || 'The contact cannot be created, please retry later'
            );

            return $q.reject(err);
          });
      }).then(function() {
        $state.go('/contact/show/:bookId/:bookName/:cardId', {
          bookId: $scope.bookId,
          bookName: $scope.bookName,
          cardId: $scope.contact.id
        }, { location: 'replace' });
      }).then(function() {
        return gracePeriodService.askUserForCancel(
          esnI18nService.translate('You have just created a new contact (%s).', $scope.contact.displayName),
          'Cancel it'
        ).promise.then(function(data) {
            if (data.cancelled) {
              contactService.removeContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.contact, { etag: $scope.contact.etag })
                .then(function() {
                  data.success();
                  openContactForm($scope.bookId, $scope.bookName, $scope.contact);
                }, function(err) {
                  data.error('Cannot cancel contact creation, the contact is created');

                  return $q.reject(err);
                });
            }
          });
      });
    };

    sharedContactDataService.contact = {};
  })
  .controller('showContactController', function(
    $q,
    $log,
    $scope,
    $state,
    $timeout,
    $rootScope,
    $stateParams,
    $window,
    ContactsHelper,
    contactUpdateDataService,
    ContactLocationHelper,
    ContactShellDisplayBuilder,
    deleteContact,
    sharedContactDataService,
    sendContactToBackend,
    displayContactError,
    notificationFactory,
    gracePeriodService,
    contactService,
    CONTACT_AVATAR_SIZE,
    CONTACT_EVENTS
  ) {
    $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = $stateParams.bookName;
    $scope.cardId = $stateParams.cardId;
    $scope.contact = {};
    $scope.loaded = false;

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if (data.id === $scope.cardId && data.addressbook && data.addressbook.bookName !== $scope.bookName) {
        $state.go('/contact/show/:bookId/:bookName/:cardId', {
          bookId: $scope.bookId,
          bookName: data.addressbook.bookName,
          cardId: data.id
        }, { location: 'replace' });
      }
    });

    function isAddressFilled(type) {
      if (!$scope.contact.addresses || !$scope.contact.addresses.length) {
        return false;
      }

      return $scope.contact.addresses.filter(function(address) {
        return address.type.toLowerCase() === type.toLowerCase();
      }).length;
    }

    $scope.fillContactData = function(contact) {
      ContactsHelper.fillScopeContactData($scope, contact);
      $scope.displayShell = ContactShellDisplayBuilder.build(contact);
    };

    $scope.getAddress = function(type) {
      return $scope.contact.addresses.filter(function(address) {
        return address.type.toLowerCase() === type.toLowerCase();
      })[0];
    };

    $scope.edit = function() {
      $state.go('/contact/edit/:bookId/:bookName/:cardId', {
        bookId: $scope.bookId,
        bookName: $scope.bookName,
        cardId: $scope.cardId
      }, { location: 'replace' });
    };

    $scope.deleteContact = function() {
      $timeout(function() {
        deleteContact($scope.bookId, $scope.bookName, $scope.contact);
      }, 200);
    };

    $scope.shouldDisplayWork = function() {
      return !!($scope.contact.orgName || $scope.contact.orgRole || isAddressFilled('work'));
    };

    $scope.shouldDisplayHome = function() {
      return !!(isAddressFilled('home') || $scope.formattedBirthday || $scope.contact.nickname);
    };

    $scope.shouldDisplayOthers = function() {
      return !!(isAddressFilled('other') || ($scope.contact.tags && $scope.contact.tags.length) || $scope.contact.notes || ($scope.contact.urls && $scope.contact.urls.length));
    };

    $scope.openAddressbook = function() {
      $state.go('contact.addressbooks', { bookName: $scope.contact.addressbook.bookName });
    };

    if (contactUpdateDataService.contact) {

      $scope.fillContactData(contactUpdateDataService.contact);

      $scope.$on('$stateChangeStart', function(evt, next, nextParams) {
        gracePeriodService.flush(contactUpdateDataService.taskId);
        // check if the user edit the contact again
        if (next && next.name && nextParams &&
            next.name === '/contact/edit/:bookId/:bookName/:cardId' &&
            nextParams.bookId === $scope.bookId &&
            nextParams.bookName === $scope.bookName &&
            nextParams.cardId === $scope.cardId) {
          // cache the contact to show in editContactController
          contactUpdateDataService.contact = $scope.contact;
        } else {
          contactUpdateDataService.contact = null;
        }
      });

      $scope.$on(CONTACT_EVENTS.CANCEL_UPDATE, function(evt, data) {
        if (data.id === $scope.cardId) {
          $scope.contact = data;
        }
      });

      $window.addEventListener('beforeunload', function() {
        gracePeriodService.flush(contactUpdateDataService.taskId);
      });

      $scope.loaded = true;
    } else {
      contactService.getContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.cardId)
        .then($scope.fillContactData, function(err) {
          $log.debug('Error while loading contact', err);
          $scope.error = true;
          displayContactError('Cannot get contact details');
        })
        .finally(function() {
          $scope.loaded = true;
        });
    }

    sharedContactDataService.contact = {};
  })
  .controller('editContactController', function(
    $scope,
    $q,
    displayContactError,
    $rootScope,
    $timeout,
    $location,
    $state,
    notificationFactory,
    sendContactToBackend,
    $stateParams,
    gracePeriodService,
    contactService,
    deleteContact,
    ContactShell,
    GRACE_DELAY,
    CONTACT_EVENTS,
    contactUpdateDataService,
    VcardBuilder,
    ContactLocationHelper,
    REDIRECT_PAGE_TIMEOUT
  ) {
    $scope.loaded = false;
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = $stateParams.bookName;
    $scope.cardId = $stateParams.cardId;

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if ($scope.contact.id === data.id && data.etag) {
        $scope.contact.etag = data.etag;
      }
    });

    var oldContact = '';

    if (contactUpdateDataService.contact) {
      $scope.contact = contactUpdateDataService.contact;
      $scope.contact.vcard = VcardBuilder.toVcard($scope.contact);
      contactUpdateDataService.contact = null;
      oldContact = JSON.stringify($scope.contact);
      $scope.loaded = true;
    } else {
      contactService.getContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.cardId)
        .then(function(contact) {
          if (!contact.addressbook.canEditContact) {
            $scope.close();
          }
          $scope.contact = contact;
          oldContact = JSON.stringify(contact);
        }, function() {
          $scope.error = true;
          displayContactError('Cannot get contact details. Redirecting to contact list display');
          $timeout(function() {
            $state.go('contact.addressbooks', {
              bookName: $scope.bookName
            }, { location: 'replace' });
          }, REDIRECT_PAGE_TIMEOUT);
        })
        .finally(function() {
          $scope.loaded = true;
        });
    }

    function isContactModified() {
      return oldContact !== JSON.stringify($scope.contact);
    }

    $scope.close = function() {
      $state.go('/contact/show/:bookId/:bookName/:cardId', {
        bookId: $scope.bookId,
        bookName: $scope.bookName,
        cardId: $scope.cardId
      }, { location: 'replace' });
    };

    $scope.save = function() {
      if (!isContactModified()) {
        return $scope.close();
      }

      return sendContactToBackend($scope, function() {
        return contactService.updateContact({ bookId: $scope.bookId, bookName: $scope.bookName }, $scope.contact)
          .then(function(taskId) {
            contactUpdateDataService.contact = $scope.contact;
            contactUpdateDataService.contactUpdatedIds.push($scope.contact.id);
            contactUpdateDataService.taskId = taskId;
            $scope.close();

            return gracePeriodService.grace({
              id: taskId,
              performedAction: 'Contact updated',
              cancelFailed: 'Cannot cancel contact update',
              cancelTooLate: 'Too late to cancel the contact update',
              gracePeriodFail: 'Failed to update contact'
            }).catch(function(err) {
              $rootScope.$broadcast(
                CONTACT_EVENTS.CANCEL_UPDATE,
                new ContactShell($scope.contact.vcard, $scope.contact.etag, $scope.contact.href)
              );

              return $q.reject(err);
            });
          }, function(err) {
            displayContactError('The contact cannot be edited, please retry later');

            return $q.reject(err);
          });
      });
    };

    $scope.deleteContact = function() {
      $timeout(function() {
        deleteContact($scope.bookId, $scope.bookName, $scope.contact);
      }, 200);
    };
  })
  .controller('contactsListController', function(
    $q,
    $log,
    $scope,
    $state,
    $stateParams,
    $location,
    $window,
    addressbooks,
    AddressBookPagination,
    AlphaCategoryService,
    ContactsHelper,
    contactUpdateDataService,
    contactAddressbookDisplayService,
    contactAddressbookService,
    esnI18nService,
    displayContactError,
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
    var requiredKey = 'displayName';
    var SPINNER = 'contactListSpinner';

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
    $scope.addressbooks = addressbooks || [];
    $scope.bookTitle = _buildAddressBookTitle();

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

    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.DELETED, function(evt, removedAddressbook) {
      if ($scope.addressbooks.length === 1 && $scope.addressbooks[0].bookName === removedAddressbook.bookName) {
        $state.go('contact.addressbooks', { bookName: null });
      }
    });

    $scope.$on(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, function(evt, newAddressbook) {
      if ($scope.addressbooks.length === 1 && $scope.addressbooks[0].bookName === newAddressbook.bookName) {
        $scope.bookTitle = newAddressbook.name;
      }
    });

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
      if (addressbooks.length > 1) {
        return openContactForm($scope.bookId, DEFAULT_ADDRESSBOOK_NAME);
      }

      if (addressbooks.length === 1) {
        return openContactForm($scope.bookId, addressbooks[0].bookName);
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

      if (_inAllContacts() || _contactBelongsCurrentAddressbook(data)) {
        $scope.$applyAsync(function() {
          $scope.categories.replaceItem(fillRequiredContactInformation(data));
        });
      } else if (!_contactBelongsCurrentAddressbook(data)) {
        $scope.categories.removeItemWithId(data.id);
      }
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
      displayContactError('Can not search contacts');
      $scope.searchFailure = true;
    }

    function loadPageComplete() {
      $scope.loadingNextContacts = false;
      usSpinnerService.stop(SPINNER);
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
      usSpinnerService.spin(SPINNER);

      return $scope.pagination.service.loadNextItems({searchInput: $scope.contactSearch.searchInput})
        .then(setSearchResults, searchFailure)
        .finally(loadPageComplete);
    }

    function getNextContacts() {
      usSpinnerService.spin(SPINNER);
      $scope.pagination.service.loadNextItems().then(function(result) {
        return addItemsToCategories(result.data);
      }, function(err) {
        $log.error('Can not get contacts', err);
        displayContactError('Can not get contacts');
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

    $scope.scrollHandler = function() {
      $log.debug('Infinite Scroll down handler');
      if ($scope.contactSearch.searchInput) {
        return scrollSearchHandler();
      }
      $scope.loadContacts();
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
    $scope.createPagination(CONTACT_LIST_DISPLAY_MODES.multiple);

    $scope.canCreateContact = $scope.addressbooks.some(function(addressbook) {
      return addressbook.canCreateContact;
    });

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
  .controller('contactAvatarModalController', function($scope, selectionService) {
    $scope.imageSelected = function() {
      return !!selectionService.getImage();
    };

    $scope.saveContactAvatar = function() {
      if (selectionService.getImage()) {
        $scope.loading = true;
        selectionService.getBlob('image/png', function(blob) {
          var reader = new FileReader();

          reader.onloadend = function() {
            $scope.contact.photo = reader.result;
            selectionService.clear();
            $scope.loading = false;
            $scope.modal.hide();
            $scope.$apply();
          };
          reader.readAsDataURL(blob);
        });
      }
    };
  })

  .controller('contactCategoryLetterController', function($scope, CONTACT_SCROLL_EVENTS, CONTACT_LIST_DISPLAY) {
    $scope.headerDisplay = {
      categoryLetter: ''
    };
    $scope.$on(CONTACT_SCROLL_EVENTS, function(event, data) {
      $scope.headerDisplay.letterExists = data !== '';
      $scope.$applyAsync(function() {
        $scope.headerDisplay.categoryLetter = data;
      });
    });

    $scope.getContactTitleDisplayCondition = function() {
      return (!$scope.headerDisplay.letterExists || $scope.displayAs === CONTACT_LIST_DISPLAY.cards) && !$scope.contactSearch.searchInput;
    };
  })

  .controller('contactItemController', function($scope, $location, $rootScope, $window, deleteContact, ContactsHelper, ContactLocationHelper, ContactHighLightHelper) {
    ContactsHelper.fillScopeContactData($scope, $scope.contact);
    ContactsHelper.getOrderType($scope);

    $scope.keySearch = $location.search().q;
    $scope.datas = [];

    $scope.hasContactInformationMatchQuery = function() {
      if ($scope.keySearch === null || angular.isUndefined($scope.keySearch)) {
        return false;
      }

      function escapeHTML(str) {
        return angular.isUndefined(str) || str === null ? '' : str.toString().toLowerCase().trim()
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
      }
      var contactHighLightHelper = new ContactHighLightHelper();
      var keySearch = escapeHTML($scope.keySearch);

      var isMatchAddress = (contactHighLightHelper.checkArrAddressMatching($scope.contact.addresses, keySearch, 'mdi-map-marker') > -1),
          isMatchSocial = (contactHighLightHelper.checkArrMatching($scope.contact.social, keySearch, 'mdi-earth') > -1),
          isMatchUrl = (contactHighLightHelper.checkArrMatching($scope.contact.urls, keySearch, 'mdi-web') > -1),
          isMatchOrganization = (contactHighLightHelper.checkStringMatch($scope.contact.orgName, keySearch, 'mdi-factory') > -1),
          isMatchJobTitle = (contactHighLightHelper.checkStringMatch($scope.contact.orgRole, keySearch, 'mdi-email') > -1),
          isMatchNick = (contactHighLightHelper.checkStringMatch($scope.contact.nickname, keySearch, 'mdi-comment-account-outline') > -1),
          isMatchNote = (contactHighLightHelper.checkStringMatch($scope.contact.notes, keySearch, 'mdi-comment-account') > -1),
          isMatchTags = (contactHighLightHelper.checkArrMatching($scope.contact.tags, keySearch, 'mdi-tag-multiple') > -1),
          isMatchBirthDay = (contactHighLightHelper.checkStringMatch($scope.formattedBirthday, keySearch, 'mdi-cake-variant') > -1);

      $scope.datas = contactHighLightHelper.dataHighlight;

      return isMatchAddress ||
             isMatchSocial ||
             isMatchUrl ||
             isMatchOrganization ||
             isMatchJobTitle ||
             isMatchNick ||
             isMatchBirthDay ||
             isMatchTags ||
             isMatchNote;
    };
    $scope.hasMatch = $scope.hasContactInformationMatchQuery();

    $scope.displayContact = function() {
      // use url instead of path to remove search and hash from URL
      ContactLocationHelper.contact.show($scope.contact.addressbook.bookId, $scope.contact.addressbook.bookName, $scope.contact.id);
    };

    $scope.editContact = function() {
      ContactLocationHelper.contact.edit($scope.contact.addressbook.bookId, $scope.contact.addressbook.bookName, $scope.contact.id);
    };

    $scope.actionClick = function(event, action) {
      if (/^(http|https):/.test(action)) {
        event.preventDefault();
        $window.open(action);
      }
      event.stopPropagation();
    };

    $scope.deleteContact = function() {
      deleteContact($scope.contact.addressbook.bookId, $scope.contact.addressbook.bookName, $scope.contact);
    };
  });
