'use strict';

angular.module('linagora.esn.contact')

  .controller('newContactController', function($rootScope, $scope, $route, $location, contactsService, notificationFactory, sendContactToBackend, displayContactError, closeContactForm, gracePeriodService, openContactForm, sharedContactDataService, $q) {
    $scope.bookId = $route.current.params.bookId;
    $scope.contact = sharedContactDataService.contact;

    $scope.close = closeContactForm;
    $scope.accept = function() {
      return sendContactToBackend($scope, function() {
        return contactsService.create($scope.bookId, $scope.contact).then(null, function(err) {
          notificationFactory.weakError('Contact creation', err && err.message || 'The contact cannot be created, please retry later');

          return $q.reject(err);
        });
      }).then(function() {
        $location.url('/contact/show/' + $scope.bookId + '/' + $scope.contact.id);
      }, function(err) {
        displayContactError(err);

        return $q.reject(err);
      }).then(function() {
        return gracePeriodService.clientGrace('You have just created a new contact (' + $scope.contact.displayName + ').', 'Cancel and back to edition')
            .then(function(data) {
              if (data.cancelled) {
                  contactsService.remove($scope.bookId, $scope.contact).then(function() {
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
  .controller('showContactController', function($log, $scope, sharedContactDataService, $rootScope, ContactsHelper, CONTACT_DEFAULT_AVATAR, $timeout, $route, contactsService, notificationFactory, sendContactToBackend, displayContactError, closeContactForm, $q, CONTACT_EVENTS, gracePeriodService, $window, contactUpdateDataService) {
    $scope.defaultAvatar = CONTACT_DEFAULT_AVATAR;
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};
    $scope.loaded = false;

    $scope.close = closeContactForm;

    $scope.deleteContact = function() {
      closeContactForm();
      $timeout(function() {
        contactsService.deleteContact($scope.bookId, $scope.contact);
      }, 200);
    };

    if (contactUpdateDataService.contact) {
      $scope.contact = contactUpdateDataService.contact;
      $scope.formattedBirthday = ContactsHelper.getFormattedBirthday($scope.contact.birthday);

      $scope.$on('$routeChangeStart', function(evt, next, current) {
        gracePeriodService.flush(contactUpdateDataService.taskId);
        // check if the user edit the contact again
        if (next && next.originalPath && next.params &&
            next.originalPath === '/contact/edit/:bookId/:cardId' &&
            next.params.bookId === $scope.bookId &&
            next.params.cardId === $scope.cardId) {
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
      contactsService.getCard($scope.bookId, $scope.cardId).then(function(card) {
        $scope.contact = card;
        $scope.formattedBirthday = ContactsHelper.getFormattedBirthday($scope.contact.birthday);
      }, function(err) {
        $log.debug('Error while loading contact', err);
        $scope.error = true;
        displayContactError('Cannot get contact details');
      }).finally (function() {
        $scope.loaded = true;
      });
    }

    sharedContactDataService.contact = {};
  })
  .controller('editContactController', function($scope, $q, displayContactError, closeContactForm, $rootScope, $timeout, $location, notificationFactory, sendContactToBackend, $route, gracePeriodService, contactsService, CONTACT_DEFAULT_AVATAR, GRACE_DELAY, gracePeriodLiveNotification, CONTACT_EVENTS, contactUpdateDataService, $log) {
    $scope.loaded = false;
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.defaultAvatar = CONTACT_DEFAULT_AVATAR;

    function isContactModified() {
      return JSON.stringify(oldContact) !== JSON.stringify($scope.contact);
    }

    // angular.copy bug workaround
    // https://github.com/angular/angular.js/pull/10116
    // Should be replaced by angular.copy after upgrade to Angular 1.4.x
    function cloneContact(contact) {
      return new contactsService.ContactsShell(contact.vcard, contact.etag);
    }

    var oldContact = {};
    if (contactUpdateDataService.contact) {
      $scope.contact = contactUpdateDataService.contact;
      contactUpdateDataService.contact = null;
      oldContact = cloneContact($scope.contact);
      $scope.loaded = true;
    } else {
      contactsService.getCard($scope.bookId, $scope.cardId).then(function(card) {
        $scope.contact = card;
        oldContact = cloneContact(card);
      }, function() {
        $scope.error = true;
        displayContactError('Cannot get contact details');
      }).finally (function() {
        $scope.loaded = true;
      });
    }

    $scope.close = function() {
      $location.path('/contact/show/' + $scope.bookId + '/' + $scope.cardId);
    };

    $scope.save = function() {
      if (!isContactModified()) {
        return $scope.close();
      }
      return sendContactToBackend($scope, function() {
        return contactsService.modify($scope.bookId, $scope.contact).then(function(taskId) {
          contactUpdateDataService.contact = $scope.contact;
          contactUpdateDataService.taskId = taskId;

          gracePeriodLiveNotification.registerListeners(
            taskId, function() {
              notificationFactory.strongError('', 'Failed to update contact, please try again later');
              $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_UPDATE, oldContact);
            }
          );

          $scope.close();

          return gracePeriodService.grace(taskId, 'You have just updated a contact.', 'Cancel')
            .then(function(data) {
              if (data.cancelled) {
                return gracePeriodService.cancel(taskId).then(function() {
                  data.success();
                  $rootScope.$broadcast(CONTACT_EVENTS.CANCEL_UPDATE, oldContact);
                }, function(err) {
                  data.error('Cannot cancel contact update');
                });
              } else {
                gracePeriodService.remove(taskId);
              }
          });
        });
      }).then(null, function(err) {
        displayContactError('The contact cannot be edited, please retry later');
        return $q.reject(err);
      });
    };

    $scope.deleteContact = function() {
      closeContactForm();
      $timeout(function() {
        contactsService.deleteContact($scope.bookId, $scope.contact);
      }, 200);
    };

  })
  .controller('contactsListController', function($log, $scope, $q, $timeout, usSpinnerService, $location, contactsService, AlphaCategoryService, ALPHA_ITEMS, user, displayContactError, openContactForm, ContactsHelper, gracePeriodService, $window, searchResultSizeFormatter, CONTACT_EVENTS, SCROLL_EVENTS, CONTACT_LIST_DISPLAY) {
    var requiredKey = 'displayName';
    var SPINNER = 'contactListSpinner';
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = requiredKey;
    $scope.prefix = 'contact-index';
    $scope.searchResult = {};
    $scope.categories = new AlphaCategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});
    $scope.lastPage = false;
    $scope.searchFailure = false;
    $scope.totalHits = 0;
    $scope.displayAs = CONTACT_LIST_DISPLAY.list;
    $scope.currentPage = 0;
    $scope.searchMode = false;

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
      $scope.searchResult.data = ($scope.searchResult.data) ? $scope.searchResult.data.concat(data.hits_list) : data.hits_list;
      $scope.searchResult.count = data.total_hits || 0;
      $scope.searchResult.formattedResultsCount = searchResultSizeFormatter($scope.searchResult.count);
    }

    function cleanSearchResults() {
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
      if ($scope.searchInput) { return; }
      $scope.categories.replaceItem(fillRequiredContactInformation(data));
    });

    $scope.$on(CONTACT_EVENTS.DELETED, function(e, contact) {
      if ($scope.searchInput) { return; }
      $scope.categories.removeItemWithId(contact.id);
    });

    $scope.$on(CONTACT_EVENTS.CANCEL_DELETE, function(e, data) {
      addItemsToCategories([data]);
    });

    $scope.$on('ngRepeatFinished', function() {
      if (!$scope.searchInput) {$scope.$emit('viewRenderFinished');}
    });

    $scope.$on('$destroy', function() {
      gracePeriodService.flushAllTasks();
    });

    $scope.$on('$routeUpdate', function() {
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

    $scope.search = function() {
      $scope.$emit(SCROLL_EVENTS.RESET_SCROLL);
      cleanSearchResults();
      cleanCategories();
      if (!$scope.searchInput) {
        $scope.searchMode = false;
        $scope.currentPage = 0;
        $scope.nextPage = 0;
        return $scope.loadContacts();
      }
      $scope.searchMode = true;
      $scope.nextPage = null;
      $scope.currentPage = 1;
      $scope.searchFailure = false;
      $scope.loadingNextContacts = true;
      $scope.lastPage = false;
      getSearchResults();
    };

    function getSearchResults() {
      $log.debug('Searching contacts, page', $scope.currentPage);
      usSpinnerService.spin(SPINNER);
      contactsService.search($scope.bookId, $scope.user._id, $scope.searchInput, $scope.currentPage).then(function(data) {
          setSearchResults(data);
          $scope.currentPage = data.current_page;
          $scope.totalHits = $scope.totalHits + data.hits_list.length;
          if ($scope.totalHits === data.total_hits) {
            $scope.lastPage = true;
          }
        }, searchFailure
      ).finally (loadPageComplete);
    }

    function getNextContacts() {
      $log.debug('Load next contacts, page', $scope.currentPage);
      usSpinnerService.spin(SPINNER);

      contactsService.list($scope.bookId, $scope.user._id, {page: $scope.nextPage || $scope.currentPage, cache: true, paginate: true}).then(function(data) {
        addItemsToCategories(data.contacts);
        $scope.lastPage = data.last_page;
        $scope.nextPage = data.next_page;
      }, function(err) {
        $log.error('Can not get contacts', err);
        displayContactError('Can not get contacts');
      }).finally (loadPageComplete);
    }

    function updateScrollState() {
      if ($scope.loadingNextContacts) {
        return $q.reject();
      }
      $scope.loadFailure = false;
      $scope.loadingNextContacts = true;
      $scope.currentPage = parseInt($scope.nextPage) || parseInt($scope.currentPage) + 1;
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

    if ($location.search().q) {
      $scope.searchInput = $location.search().q.replace(/\+/g, ' ');
      $scope.search();
    } else {
      $scope.searchInput = null;
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
            $scope.modify();
          };
          reader.readAsDataURL(blob);
        });
      }
    };
  })

  .controller('contactItemController', function($scope, $rootScope, $location, contactsService) {

    $scope.displayContact = function() {
      $location.path('/contact/show/' + $scope.bookId + '/' + $scope.contact.id);
    };

    $scope.deleteContact = function() {
      contactsService.deleteContact($scope.bookId, $scope.contact);
    };
  });
