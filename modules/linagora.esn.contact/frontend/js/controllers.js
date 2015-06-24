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
  .controller('newContactController', function($scope, $route, contactsService, notificationFactory, sendContactToBackend, displayError, closeForm) {
    $scope.bookId = $route.current.params.bookId;
    $scope.contact = {};
    $scope.close = closeForm;
    $scope.accept = function() {
      return sendContactToBackend($scope, function() {
        return contactsService.create('/addressbooks/' + $scope.bookId + '/contacts', contactsService.shellToVCARD($scope.contact)).then(function() {
          notificationFactory.weakInfo('Contact creation', 'Successfully created ' + $scope.contact.displayName);
        }, function(err) {
          notificationFactory.weakError('Contact creation', err && err.message || 'Something went wrong');
        });
      }).then(closeForm, displayError);
    };
  })
  .controller('showContactController', function($scope, $route, contactsService, notificationFactory, sendContactToBackend, displayError, closeForm, $q) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};

    $scope.close = closeForm;
    $scope.modify = function() {
      return sendContactToBackend($scope, function() {
        return contactsService.modify($scope.contact.path, contactsService.shellToVCARD($scope.contact), $scope.contact.etag).then(function(contact) {
          notificationFactory.weakInfo('Contact modification success', 'Successfully modified the contact ' + contact.displayName);
          $scope.contact = contact;

          return contact;
        }, function(err) {
          notificationFactory.weakError('Contact modification failure', err && err.message || 'Something went wrong');
        });
      }).then(null, function(err) {
        displayError(err);

        return $q.reject(err);
      });
    };
    $scope.accept = function() {
      return $scope.modify().then(closeForm);
    };

    contactsService.getCard('/addressbooks/' + $scope.bookId + '/contacts/' + $scope.cardId + '.vcf').then(function(card) {
      $scope.contact = card;
    }, function() {
      displayError('Cannot get contact details');
    });
  })
  .controller('contactsListController', function($log, $scope, $location, contactsService, AlphaCategoryService, ALPHA_ITEMS, user, displayError) {
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = 'firstName';
    $scope.prefix = 'contact-index';
    $scope.showMenu = false;
    $scope.categories = new AlphaCategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});

    $scope.loadContacts = function() {
      var path = '/addressbooks/' + $scope.bookId + '/contacts.json';
      contactsService.list(path).then(function(data) {
        $scope.categories.addItems(data);
        $scope.sorted_contacts = $scope.categories.get();
      }, function(err) {
        $log.error('Can not get contacts', err);
        displayError('Can not get contacts');
      });

      $scope.openContactCreation = function() {
        $location.path('/contact/new/' + $scope.bookId);
      };

      $scope.$on('contact:deleted', function(event, contact) {
        $scope.categories.removeItem(contact);
      });
    };

    $scope.loadContacts();

    $scope.$on('ngRepeatFinished', function() {
      $scope.showMenu = true;
    });
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
  });
