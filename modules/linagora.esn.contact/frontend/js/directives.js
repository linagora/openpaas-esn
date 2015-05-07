'use strict';

angular.module('linagora.esn.contact')
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contacts/views/partials/contact-navbar-link.html'
    };
  })
  .controller('MultiInputGroupController', function($scope) {
    $scope.acceptNew = function() {
      $scope.content.push($.extend({}, $scope.newItem));
      if (Object.keys($scope.typesMap).length === 1) {
        $scope.types.forEach(function(t) { $scope.typesMap[t] = true; });
      }
      delete $scope.typesMap[$scope.newItem.type];
      $scope.newItem = {};
      $scope.newItem.type = Object.keys($scope.typesMap)[0];
    };

    $scope.acceptRemove = function($index) {
      var val = $scope.content[$index];
      $scope.typesMap[val.type] = true;
      $scope.content.splice($index, 1);
    };

    $scope.init = function() {
      $scope.types.forEach(function(t) { $scope.typesMap[t] = true; });
      $scope.newItem.type = Object.keys($scope.typesMap)[0];
    };

    $scope.content = [];

    $scope.typesMap = {};

    $scope.newItem = {};
  })
  .directive('multiInputGroup', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder'
      },
      templateUrl: '/contacts/views/partials/multi-input-group',
      controller: 'MultiInputGroupController',
      link: function($scope) {
        $scope.verifyNew = function() {
          var item = $scope.newItem;
          if (item.value) {
            $scope.acceptNew();
          }
        };

        $scope.verifyRemove = function($index) {
          var item = $scope.content[$index];
          if (!item.value) {
            $scope.acceptRemove($index);
          }
        };

        $scope.init();
      }
    };
  })
  .directive('multiInputGroupAddress', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder'
      },
      templateUrl: '/contacts/views/partials/multi-input-group-address',
      controller: 'MultiInputGroupController',
      link: function($scope, element, attrs, parent) {
        $scope.verifyNew = function() {
          var item = $scope.newItem;
          if (item.street && item.zip && item.city && item.country) {
            $scope.acceptNew();
          }
        };
        $scope.verifyRemove = function($index) {
          var item = $scope.content[$index];
          if (!item.street) {
            $scope.acceptRemove($index);
          }
        };

        $scope.init();
      }
    };
  })
  .directive('newContactForm', ['contactsService', function(contactsService) {
    return {
      restrict: 'E',
      scope: {
        'bookId': '=',
        'close': '&onClose'
      },
      templateUrl: '/contacts/views/partials/new-contact-form.html',
      link: function($scope, element, attrs) {
        $scope.contact = {};

        $scope.addContact = function() {
          var vcard = contactsService.shellToVCARD($scope.contact);
          var path = '/addressbooks/' + $scope.bookId + '/contacts';
          contactsService.create(path, vcard);
        };
      }
    };
  }]);
