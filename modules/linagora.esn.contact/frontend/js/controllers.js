'use strict';

angular.module('linagora.esn.contact')
  .constant('DEFAULT_AVATAR', '/images/user.png')
  .factory('displayError', function($alert) {
    return function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.contact-error-container',
        duration: '3',
        animation: 'am-flip-x'
      });
    };
  })
  .factory('closeForm', function($location) {
    return function() {
      $location.path('/contact');
    };
  })
  .factory('openContactForm', function($location, sharedDataService) {
    return function(bookId, contact) {
      if (contact) {
        sharedDataService.contact = contact;
      }

      $location.path('/contact/new/' + bookId);
    };
  })
  .factory('sharedDataService', function() {
    return {
      contact: {}
    };
  })
  .factory('sendContactToBackend', function($location, ContactsHelper, $q) {
    return function($scope, sendRequest) {
      if ($scope.calling) {
        return $q.reject('The form is already being submitted');
      }

      $scope.contact.displayName = ContactsHelper.getFormattedName($scope.contact);
      if (!$scope.contact.displayName) {
        return $q.reject('Please fill at least a field');
      }

      $scope.calling = true;

      return sendRequest().finally (function() {
        $scope.calling = false;
      });
    };
  })
  .controller('newContactController', function($rootScope, $scope, $route, contactsService, notificationFactory, sendContactToBackend, displayError, closeForm, gracePeriodService, openContactForm, sharedDataService, $q) {
    $scope.bookId = $route.current.params.bookId;
    $scope.contact = sharedDataService.contact;

    $scope.close = closeForm;
    $scope.accept = function() {
      return sendContactToBackend($scope, function() {
        return contactsService.create($scope.bookId, $scope.contact).then(null, function(err) {
          notificationFactory.weakError('Contact creation', err && err.message || 'The contact cannot be created, please retry later');

          return $q.reject(err);
        });
      }).then(closeForm, function(err) {
        displayError(err);

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

    sharedDataService.contact = {};
  })
  .controller('showContactController', function($scope, sharedDataService, $rootScope, ContactsHelper, DEFAULT_AVATAR, $timeout, $route, contactsService, notificationFactory, sendContactToBackend, displayError, closeForm, $q, CONTACT_EVENTS) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};

    $scope.close = closeForm;

    $scope.deleteContact = function() {
      closeForm();
      $timeout(function() {
        contactsService.deleteContact($scope.bookId, $scope.contact);
      }, 200);
    };

    function _modify() {
      return sendContactToBackend($scope, function() {
        return contactsService.modify($scope.bookId, $scope.contact).then(function(contact) {
          $rootScope.$broadcast(CONTACT_EVENTS.UPDATED);
          $scope.contact = contact;
          return contact;
        }, function(err) {
        });
      }).then(null, function(err) {
        displayError(err);
        return $q.reject(err);
      });
    }

    $scope.modify = function() {
      $timeout(_modify, 0);
    };

    contactsService.getCard($scope.bookId, $scope.cardId).then(function(card) {
      $scope.contact = card;
      $scope.formattedBirthday = ContactsHelper.getFormattedBirthday($scope.contact.birthday);
      $scope.defaultAvatar = DEFAULT_AVATAR;
    }, function() {
      displayError('Cannot get contact details');
    });

    sharedDataService.contact = {};
  })
  .controller('editContactController', function($scope, $q, displayError, closeForm, $rootScope, $timeout, $location, notificationFactory, sendContactToBackend, $route, gracePeriodService, contactsService, defaultAvatarService, DEFAULT_AVATAR, GRACE_DELAY) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    contactsService.getCard($scope.bookId, $scope.cardId).then(function(card) {
      $scope.contact = card;
      $scope.oldDisplayName = $scope.contact.displayName;
      $scope.defaultAvatar = DEFAULT_AVATAR;
    }, function() {
      displayError('Cannot get contact details');
    });

    $scope.close = closeForm;

    $scope.save = function() {
      return sendContactToBackend($scope, function() {
        return contactsService.modify($scope.bookId, $scope.contact).then(function(contact) {
          $scope.contact = contact;
          if ($scope.oldDisplayName.charAt(0) !== $scope.contact.displayName.charAt(0)) {
            if ($scope.contact.photo.indexOf('avatar') !== -1) {
              defaultAvatarService.insertPhotoUrl($scope.contact.id, $scope.contact.photo += '?cb=' + Date.now());
            }
          }
          return contact;
        }, function(err) {
        });
      }).then(function() {
        $location.path('/contact/show/' + $scope.bookId + '/' + $scope.cardId);
      }, function(err) {
        displayError(err);
        return $q.reject(err);
      });
    };

    $scope.deleteContact = function() {
      closeForm();
      $timeout(function() {
        contactsService.deleteContact($scope.bookId, $scope.contact);
      }, 200);
    };

  })
  .controller('contactsListController', function($log, $scope, usSpinnerService, $location, contactsService, AlphaCategoryService, ALPHA_ITEMS, user, displayError, openContactForm, ContactsHelper, gracePeriodService, $window, searchResultSizeFormatter, CONTACT_EVENTS, CONTACT_LIST_DISPLAY) {
    var requiredKey = 'displayName';
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
      $scope.searchResult.data = data.hits_list;
      $scope.searchResult.count = data.total_hits || 0;
      $scope.searchResult.formattedResultsCount = searchResultSizeFormatter($scope.searchResult.count);
    }

    function cleanSearchResults() {
      $scope.searchResult = {};
      $scope.totalHits = 0;
    }

    $scope.loadContacts = function() {
      return contactsService.list($scope.bookId).then(addItemsToCategories, function(err) {
        $log.error('Can not get contacts', err);
        displayError('Can not get contacts');
      });
    };

    $scope.openContactCreation = function() {
      openContactForm($scope.bookId);
    };

    $scope.$on(CONTACT_EVENTS.CREATED, function(e, data) {
      if ($scope.searchInput) { return; }
      addItemsToCategories([data]);
    });

    $scope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      $scope.categories.replaceItem(fillRequiredContactInformation(data));
    });

    $scope.$on(CONTACT_EVENTS.DELETED, function(e, contact) {
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

    $scope.search = function() {
      $scope.$emit('resetScrollPosition');
      cleanSearchResults();
      $scope.currentPage = 1;
      $scope.searchFailure = false;
      if (!$scope.searchInput) {
        cleanCategories();
        return $scope.loadContacts();
      }
      $scope.loadingNextSearchResults = true;
      $scope.lastPage = false;
      contactsService.search($scope.bookId, $scope.user._id, $scope.searchInput).then(function(data) {
        cleanCategories();
        setSearchResults(data);
        addItemsToCategories(data.hits_list);
        $scope.current_page = data.current_page;
        $scope.totalHits = $scope.totalHits + data.hits_list.length;
        if ($scope.totalHits === data.total_hits) {
          $scope.lastPage = true;
        }
      }, function(err) {
        $log.error('Can not search contacts', err);
        displayError('Can not search contacts');
        $scope.searchFailure = true;
      }).finally (function() {
        $scope.loadingNextSearchResults = false;
      });
    };

    function getNextResults() {
      usSpinnerService.spin('contactSearchSpinner');
      $scope.searchFailure = false;
      $scope.loadingNextSearchResults = true;
      contactsService.search($scope.bookId, $scope.user._id, $scope.searchInput, $scope.current_page).then(function(data) {
        $scope.current_page = data.current_page;
        addItemsToCategories(data.hits_list);
        $scope.totalHits = $scope.totalHits + data.hits_list.length;
        if ($scope.totalHits === data.total_hits) {
          $scope.lastPage = true;
        }
      }, function(err) {
        $log.error('Can not search contacts', err);
        displayError('Can not search contacts');
        $scope.searchFailure = true;
      }).finally (function() {
        $scope.loadingNextSearchResults = false;
        usSpinnerService.stop('contactSearchSpinner');
      });
    }

    $scope.scrollHandler = function() {
      if ($scope.loadingNextSearchResults || !$scope.searchInput) {
        return;
      }
      $scope.loadingNextSearchResults = true;
      $scope.current_page++;
      getNextResults();
    };


    if ($location.search().q) {
      $scope.searchInput = $location.search().q.replace(/\+/g, ' ');
      $scope.search();
    }
    else {
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

  .controller('contactItemController', function($scope, $rootScope, $location, contactsService, notificationFactory, gracePeriodService, CONTACT_EVENTS, GRACE_DELAY) {

    function getFirstValue(property) {
      if (!$scope.contact[property] || !$scope.contact[property][0]) {
        return;
      }
      return $scope.contact[property][0].value;
    }

    function getFirstElement(property) {
      if ($scope.contact[property] && $scope.contact[property][0]) {
        return $scope.contact[property][0];
      }
    }

    function getElement(property) {
      return $scope.contact[property];
    }

    $scope.email = getFirstValue('emails');
    $scope.tel = getFirstValue('tel');
    $scope.org = getFirstElement('org');
    $scope.role = getElement('orgRole');

    $scope.displayContact = function() {
      $location.path('/contact/show/' + $scope.bookId + '/' + $scope.contact.id);
    };

    $scope.deleteContact = function() {
      contactsService.deleteContact($scope.bookId, $scope.contact);
    };
  });
