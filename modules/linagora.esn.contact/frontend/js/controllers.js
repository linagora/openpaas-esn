'use strict';

angular.module('linagora.esn.contact')
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
        return gracePeriodService.grace('You have just created a new contact (' + $scope.contact.displayName + ').', 'Cancel and back to edition')
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
  .controller('showContactController', function($scope, $rootScope, $timeout, $route, contactsService, notificationFactory, sendContactToBackend, displayError, closeForm, $q) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};

    $scope.close = closeForm;

    function _modify() {
      return sendContactToBackend($scope, function() {
        return contactsService.modify($scope.bookId, $scope.contact).then(function(contact) {
          $rootScope.$broadcast('contact:updated');
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
    }, function() {
      displayError('Cannot get contact details');
    });
  })
  .controller('displayContactController', function($scope, $timeout, $route, contactsService, closeForm, displayError) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};
    $scope.back = closeForm;

    contactsService.getCard($scope.bookId, $scope.cardId).then(function(card) {
      $scope.contact = card;
      console.log($scope.contact);
      if ($scope.contact.birthday instanceof Date) {
        $scope.formatedBirthday = $scope.contact.birthday.getMonth() +
                                  '/' +
                                  $scope.contact.birthday.getUTCDate() +
                                  '/' +
                                  $scope.contact.birthday.getUTCFullYear();
      }
      else {
        $scope.formatedBirthday = $scope.contact.birthday;
      }
    }, function() {
      displayError('Cannot get contact details');
    });
    $('.panel-header').parent().parent().parent().parent().addClass('no-padding');
    $scope.controlBarPosition = $('.contact-controls').offset();
  })
  .controller('editContactController', function() {

  })
  .controller('contactsListController', function($log, $scope, $location, contactsService, AlphaCategoryService, ALPHA_ITEMS, user, displayError, openContactForm, ContactsHelper) {
    var requiredKey = 'displayName';
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = requiredKey;
    $scope.prefix = 'contact-index';
    $scope.showMenu = false;
    $scope.categories = new AlphaCategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});

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
      data = data.map(fillRequiredContactInformation);
      $scope.categories.addItems(data);
      $scope.sorted_contacts = $scope.categories.get();
    }

    $scope.loadContacts = function() {
      contactsService.list($scope.bookId).then(addItemsToCategories, function(err) {
        $log.error('Can not get contacts', err);
        displayError('Can not get contacts');
      });

    };
    $scope.openContactCreation = function() {
      openContactForm($scope.bookId);
    };

    $scope.$on('contact:deleted', function(event, contact) {
      $scope.categories.removeItem(contact);
    });
    $scope.$on('contact:cancel:delete', function(e, data) {
      addItemsToCategories([data]);
    });
    $scope.$on('ngRepeatFinished', function() {
      $scope.showMenu = true;
    });

    $scope.search = function() {

      if (!$scope.searchInput) {
        return $scope.loadContacts();
      }

      contactsService.search($scope.bookId, $scope.user._id, $scope.searchInput).then(function(data) {
        $scope.categories.init();
        addItemsToCategories(data);
      }, function(err) {
        $log.error('Can not search contacts', err);
        displayError('Can not search contacts');
      });
    };

    $scope.loadContacts();
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
  });
