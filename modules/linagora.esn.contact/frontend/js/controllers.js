'use strict';

angular.module('linagora.esn.contact')
  .controller('newContactController', ['$scope', '$route', '$location', 'contactsService', 'notificationFactory', function($scope, $route, $location, contactsService, notificationFactory) {
    $scope.bookId = $route.current.params.bookId;
    $scope.contact = {};

    $scope.close = function() {
      $location.path('/contacts');
    };
    $scope.accept = function() {
      var vcard = contactsService.shellToVCARD($scope.contact);
      var path = '/addressbooks/' + $scope.bookId + '/contacts';
      contactsService.create(path, vcard).then(function() {
        $scope.close();
        notificationFactory.weakInfo('Contact creation success', 'Successfully created the new contact');
      }).catch (function(err) {
        notificationFactory.weakError('Contact creation failure', err.message);
      });
    };
  }])
  .controller('showContactController', ['$scope', '$route', '$location', 'contactsService', 'notificationFactory', function($scope, $route, $location, contactsService, notificationFactory) {
    $scope.bookId = $route.current.params.bookId;
    $scope.cardId = $route.current.params.cardId;
    $scope.contact = {};

    $scope.close = function() {
      $location.path('/contacts');
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
  .controller('contactsListController', ['$log', '$scope', '$document', 'contactsService', 'alphaCategoryService', 'ALPHA_ITEMS', 'user', function($log, $scope, $document, contactsService, CategoryService, ALPHA_ITEMS, user) {
    $scope.user = user;
    $scope.bookId = $scope.user._id;
    $scope.keys = ALPHA_ITEMS;
    $scope.sortBy = 'firstName';
    $scope.prefix = 'contacts_';

    $scope.categories = new CategoryService({keys: $scope.keys, sortBy: $scope.sortBy, keepAll: true, keepAllKey: '-'});

    $scope.loadContacts = function() {
      var path = '/addressbooks/' + $scope.user._id + '/contacts';
      contactsService.list(path).then(function(data) {
        $scope.categories.addItems(data);
        $scope.sorted_contacts = $scope.categories.get();
      }, function(err) {
        $log.error('Can not get contacts', err);
      });
    };

    $scope.loadContacts();
  }]);
