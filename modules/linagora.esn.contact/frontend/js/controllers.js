'use strict';

angular.module('linagora.esn.contact')

  .controller('newContactController', function($rootScope, $scope, $stateParams, $location, notificationFactory, sendContactToBackend, displayContactError, closeContactForm, gracePeriodService, openContactForm, sharedContactDataService, $q, ContactAPIClient, ContactLocationHelper, DEFAULT_ADDRESSBOOK_NAME) {
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = DEFAULT_ADDRESSBOOK_NAME;
    $scope.contact = sharedContactDataService.contact;

    $scope.close = closeContactForm;
    $scope.accept = function() {
      return sendContactToBackend($scope, function() {
        return ContactAPIClient
          .addressbookHome($scope.bookId)
          .addressbook($scope.bookName)
          .vcard()
          .create($scope.contact)
          .then(null, function(err) {
            notificationFactory.weakError(
              'Contact creation',
              err && err.message || 'The contact cannot be created, please retry later'
            );

            return $q.reject(err);
          });
      }).then(function() {
        ContactLocationHelper.contact.show($scope.bookId, $scope.bookName, $scope.contact.id);
      }, function(err) {
        displayContactError(err);
        return $q.reject(err);
      }).then(function() {
        return gracePeriodService.clientGrace(
            'You have just created a new contact (' + $scope.contact.displayName + ').', 'Cancel and back to edition'
          ).then(function(data) {
            if (data.cancelled) {
              ContactAPIClient
                .addressbookHome($scope.bookId)
                .addressbook($scope.bookName)
                .vcard($scope.contact.id)
                .remove({ etag: $scope.contact.etag })
                .then(function() {
                  data.success();
                  openContactForm($scope.bookId, $scope.contact);
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
  .controller('showContactController', function($log, $scope, sharedContactDataService, $rootScope, ContactsHelper, CONTACT_AVATAR_SIZE, $timeout, $stateParams, deleteContact, notificationFactory, sendContactToBackend, displayContactError, closeContactForm, $q, CONTACT_EVENTS, gracePeriodService, $window, contactUpdateDataService, ContactAPIClient, ContactLocationHelper, ContactShellDisplayBuilder) {
    $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
    $scope.bookId = $stateParams.bookId;
    $scope.bookName = $stateParams.bookName;
    $scope.cardId = $stateParams.cardId;
    $scope.contact = {};
    $scope.loaded = false;

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

    $scope.close = closeContactForm;

    $scope.edit = function() {
      ContactLocationHelper.contact.edit($scope.bookId, $scope.bookName, $scope.contact.id);
    };

    $scope.deleteContact = function() {
      closeContactForm();
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
      ContactAPIClient
        .addressbookHome($scope.bookId)
        .addressbook($scope.bookName)
        .vcard($scope.cardId)
        .get()
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
  .controller('editContactController', function($scope, $q, displayContactError, closeContactForm, $rootScope, $timeout, $location, notificationFactory, sendContactToBackend, $stateParams, gracePeriodService, deleteContact, ContactShell, GRACE_DELAY, gracePeriodLiveNotification, CONTACT_EVENTS, contactUpdateDataService, ContactAPIClient, VcardBuilder, ContactLocationHelper) {
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
      ContactAPIClient
        .addressbookHome($scope.bookId)
        .addressbook($scope.bookName)
        .vcard($scope.cardId)
        .get()
        .then(function(contact) {
          if (!contact.addressbook.editable) {
            $scope.close();
          }
          $scope.contact = contact;
          oldContact = JSON.stringify(contact);
        }, function() {
          $scope.error = true;
          displayContactError('Cannot get contact details');
        })
        .finally(function() {
          $scope.loaded = true;
        });
    }

    function isContactModified() {
      return oldContact !== JSON.stringify($scope.contact);
    }

    $scope.close = function() {
      ContactLocationHelper.contact.show($scope.bookId, $scope.bookName, $scope.cardId);
    };

    $scope.save = function() {
      if (!isContactModified()) {
        return $scope.close();
      }
      return sendContactToBackend($scope, function() {
        return ContactAPIClient
          .addressbookHome($scope.bookId)
          .addressbook($scope.bookName)
          .vcard($scope.contact.id)
          .update($scope.contact)
          .then(function(taskId) {
            contactUpdateDataService.contact = $scope.contact;
            contactUpdateDataService.contactUpdatedIds.push($scope.contact.id);
            contactUpdateDataService.taskId = taskId;
            gracePeriodLiveNotification.registerListeners(taskId, function() {
              notificationFactory.strongError(
                '', 'Failed to update contact, please try again later');
              $rootScope.$broadcast(
                CONTACT_EVENTS.CANCEL_UPDATE,
                new ContactShell($scope.contact.vcard, $scope.contact.etag));
            });

            $scope.close();

            return gracePeriodService.grace(taskId, 'You have just updated a contact.', 'Cancel')
              .then(function(data) {
                if (data.cancelled) {
                  return gracePeriodService.cancel(taskId).then(function() {
                    data.success();
                    $rootScope.$broadcast(
                      CONTACT_EVENTS.CANCEL_UPDATE,
                      new ContactShell($scope.contact.vcard, $scope.contact.etag, $scope.contact.href)
                    );
                  }, function(err) {
                    data.error('Cannot cancel contact update');
                  });
                } else {
                  gracePeriodService.remove(taskId);
                }
              });
          }).then(null, function(err) {
            displayContactError('The contact cannot be edited, please retry later');
            return $q.reject(err);
          });
      });
    };

    $scope.deleteContact = function() {
      closeContactForm();
      $timeout(function() {
        deleteContact($scope.bookId, $scope.bookName, $scope.contact);
      }, 200);
    };

  })
  .controller('contactsListController', function($log, $scope, $q, $timeout, usSpinnerService, $location, AlphaCategoryService, ALPHA_ITEMS, user, displayContactError, openContactForm, ContactsHelper, gracePeriodService, $window, searchResultSizeFormatter, CONTACT_EVENTS, CONTACT_LIST_DISPLAY, sharedContactDataService, ContactAPIClient, DEFAULT_ADDRESSBOOK_NAME, contactUpdateDataService, AddressBookPagination, addressbooks, CONTACT_LIST_DISPLAY_MODES) {
    var requiredKey = 'displayName';
    var SPINNER = 'contactListSpinner';
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = requiredKey;
    $scope.prefix = 'contact-index';
    $scope.searchResult = {};
    $scope.updatedDuringSearch = null;
    $scope.categories = new AlphaCategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});
    $scope.searchFailure = false;
    $scope.totalHits = 0;
    $scope.displayAs = CONTACT_LIST_DISPLAY.multiple;
    $scope.addressbooks = addressbooks || [];

    $scope.$on('$stateChangeStart', function(evt, next) {
      // store the search query so the search list can be restored when the user
      // switches back to contacts list
      if (next.name === '/contact/show/:bookId/:bookName/:cardId' ||
          next.name === '/contact/edit/:bookId/:bookName/:cardId') {
        sharedContactDataService.searchQuery = $scope.searchInput;
      } else {
        sharedContactDataService.searchQuery = null;
      }
    });

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
      return $scope.$applyAsync(function() {
        data = data.map(fillRequiredContactInformation);
        $scope.categories.addItems(data);
        $scope.sorted_contacts = $scope.categories.get();
      });
    }

    function cleanCategories() {
      $scope.categories.init();
      delete $scope.sorted_contacts;
    }

    function setSearchResults(data) {
      $scope.searchResult.data = ($scope.searchResult.data) ? $scope.searchResult.data.concat(data.data) : data.data;
      $scope.searchResult.count = data.total_hits || 0;
      $scope.searchResult.formattedResultsCount = searchResultSizeFormatter($scope.searchResult.count);
    }

    function cleanSearchResults() {
      $scope.searchFailure = false;
      $scope.searchResult = {};
      $scope.totalHits = 0;
    }

    $scope.openContactCreation = function() {
      openContactForm($scope.bookId);
    };

    $scope.$on(CONTACT_EVENTS.CREATED, function(e, data) {
      if ($scope.searchInput) { return; }
      addItemsToCategories([data]);
    });

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if (contactUpdateDataService.contactUpdatedIds.indexOf(data.id) === -1) {
        contactUpdateDataService.contactUpdatedIds.push(data.id);
      }
      if ($scope.searchInput) { return; }
      $scope.$applyAsync(function() {
        $scope.categories.replaceItem(fillRequiredContactInformation(data));
      });
    });

    $scope.$on(CONTACT_EVENTS.DELETED, function(e, contact) {
      if ($scope.searchInput) {
        contact.deleted = true;
      } else {
        $scope.categories.removeItemWithId(contact.id);
      }
    });

    $scope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(e, data) {
      if ($scope.searchInput) {
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
        if (!$scope.searchInput) {return;}
        $scope.searchInput = null;
        return $scope.search();
      }
      if ($location.search().q.replace(/\+/g, ' ') !== $scope.searchInput) {
        $scope.searchInput = $location.search().q.replace(/\+/g, ' ');
        return $scope.search();
      }
    });

    $window.addEventListener('beforeunload', gracePeriodService.flushAllTasks);

    $scope.appendQueryToURL = function() {
      if ($scope.searchInput) {
        $location.search('q', $scope.searchInput.replace(/ /g, '+'));
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
        $scope.updatedDuringSearch = $scope.searchInput;
        return;
      }

      $scope.appendQueryToURL();
      cleanSearchResults();
      cleanCategories();
      if (!$scope.searchInput) {
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
      return $scope.pagination.service.loadNextItems({searchInput: $scope.searchInput})
        .then(setSearchResults, searchFailure)
        .finally(loadPageComplete);
    }

    function getNextContacts() {
      usSpinnerService.spin(SPINNER);
      $scope.pagination.service.loadNextItems().then(function(result) {
        addItemsToCategories(result.data);
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
      if ($scope.searchInput) {
        return scrollSearchHandler();
      }
      $scope.loadContacts();
    };

    $scope.clearSearchInput = function() {
      $scope.searchInput = null;
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

    if ($location.search().q) {
      $scope.searchInput = $location.search().q.replace(/\+/g, ' ');
      $scope.search();
    } else if (sharedContactDataService.searchQuery) {
      $location.search('q', sharedContactDataService.searchQuery.replace(/ /g, '+'));
    } else {
      $scope.searchInput = null;
      $scope.loadContacts();
    }

    $scope.getContactTitleDisplayCondition = function() {
      return (!$scope.headerDisplay.letterExists || $scope.displayAs === CONTACT_LIST_DISPLAY.cards) && !$scope.searchInput;
    };
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
            $scope.modify();
          };
          reader.readAsDataURL(blob);
        });
      }
    };
  })

  .controller('contactCategoryLetterController', function($scope, CONTACT_SCROLL_EVENTS) {
    $scope.headerDisplay = {
      categoryLetter: ''
    };
    $scope.$on(CONTACT_SCROLL_EVENTS, function(event, data) {
      $scope.headerDisplay.letterExists = data !== '';
      $scope.$applyAsync(function() {
        $scope.headerDisplay.categoryLetter = data;
      });
    });
  })

  .controller('contactItemController', function($scope, $location, $rootScope, $window, deleteContact, ContactsHelper, ContactLocationHelper) {
    ContactsHelper.fillScopeContactData($scope, $scope.contact);

    $scope.keySearch = $location.search().q;

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
