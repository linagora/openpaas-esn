'use strict';

angular.module('linagora.esn.contact')
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contacts/views/partials/contact-navbar-link.html'
    };
  })
  .controller('MultiInputGroupController', ['$scope', '$timeout', function($scope, $timeout) {
    function updateTypes() {
      $scope.newItem.type = $scope.types[$scope.content.length % $scope.types.length];
    }

    $scope.acceptNew = function() {
      $scope.content.push($scope.newItem);
      $scope.newItem = {};
      updateTypes();
    };

    $scope.acceptRemove = function($index) {
      $scope.content.splice($index, 1);
      updateTypes();
    };

    $scope.$watch('content', updateTypes);

    $scope.content = [];
    $scope.newItem = {};
  }])
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
      }
    };
  })
  .directive('contactDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        'contact': '='
      },
      templateUrl: '/contacts/views/partials/contact-display.html'
    };
  })

  .directive('contactListItem', [function() {
    return {
      restrict: 'E',
      /*scope: {
        'contact': '='
      },*/
      templateUrl: '/contacts/views/partials/contact-list-item.html'
    };
  }]);
