'use strict';

angular.module('linagora.esn.contact')
  .controller('newContactController', ['$scope', '$route', '$location', 'contactsService', 'notificationFactory', function($scope, $route, $location, contactsService, notificationFactory) {
    $scope.bookId = $route.current.params.bookId;
    $scope.contact = {};
    $scope.calling = false;

    $scope.close = function() {
      $location.path('/contact');
    };

    function getContactDisplay() {
      return [$scope.contact.firstName || '', $scope.contact.lastName || ''].join(' ').trim();
    }

    $scope.accept = function() {
      if ($scope.calling) {
        return;
      }
      $scope.calling = true;
      var vcard = contactsService.shellToVCARD($scope.contact);
      var path = '/addressbooks/' + $scope.bookId + '/contacts';
      contactsService.create(path, vcard).then(function() {
        $scope.close();
        notificationFactory.weakInfo('Contact creation', 'Successfully created ' + getContactDisplay());
      }, function(err) {
        notificationFactory.weakError('Contact creation', err.message || 'Something went wrong');
      }).finally (function() {
        $scope.calling = false;
      });
    };
  }])
  .controller('showContactController', ['$scope', '$route', '$location', 'contactsService', 'notificationFactory', function($scope, $route, $location, contactsService, notificationFactory) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};

    $scope.close = function() {
      $location.path('/contact');
    };

    $scope.accept = function() {
      var vcard = contactsService.shellToVCARD($scope.contact);
      contactsService.modify($scope.contact.path, vcard, $scope.contact.etag).then(function() {
        $scope.close();
        notificationFactory.weakInfo('Contact modification success', 'Successfully modified the new contact');
      }).catch (function(err) {
        notificationFactory.weakError('Contact modification failure', err.message);
      });
    };

    $scope.init = function() {
      var cardUrl = '/addressbooks/' + $scope.bookId + '/contacts/' + $scope.cardId + '.vcf';
      contactsService.getCard(cardUrl).then(function(card) {
        $scope.contact = card;
      });
    };

    $scope.init();
  }])
  .controller('contactsListController', ['$timeout', '$log', '$scope', '$location', 'contactsService', 'alphaCategoryService', 'ALPHA_ITEMS', 'user', function($timeout, $log, $scope, $location, contactsService, CategoryService, ALPHA_ITEMS, user) {
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = 'firstName';
    $scope.prefix = 'contact-index';
    $scope.showMenu = false;

    $scope.categories = new CategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '#'});

    $scope.loadContacts = function() {
      var path = '/addressbooks/' + $scope.bookId + '/contacts.json';
      contactsService.list(path).then(function(data) {
        $scope.categories.addItems(data);
        $scope.sorted_contacts = $scope.categories.get();
      }, function(err) {
        $log.error('Can not get contacts', err);
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
  }])
  .controller('contactsCardsController', ['$log', '$scope', '$location', 'contactsService', 'user', function($log, $scope, $location, contactsService, user) {
    $scope.user = user;
    $scope.bookId = $scope.user._id;

    $scope.contactPath = 'https://sabre-dev.open-paas.org/addressbooks/' + $scope.bookId + '/contacts';
    $scope.showContactPath = false;
    $scope.toggleContactPath = function() {
      $scope.showContactPath = !$scope.showContactPath;
    }

    $scope.loadContacts = function() {
      var path = '/addressbooks/' + $scope.bookId + '/contacts.json';
      contactsService.list(path).then(function(data) {
        $scope.contacts = data;
      }, function(err) {
        $log.error('Can not get contacts', err);
      });

      $scope.openContactCreation = function() {
        $location.path('/contact/new/' + $scope.bookId);
      };
    };

    $scope.loadContacts();
  }])
  .controller('contactAvatarModalController', ['$scope', 'selectionService', function($scope, selectionService) {
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
  }]);
