'use strict';

angular.module('esn.multi-input', [])

  .factory('multiInputService', function($timeout) {
    var focusLastItem = function(element, className) {
      $timeout(function() {
        element.find(className).last().focus();
      }, 0, false);
    };

    return {
      focusLastItem: focusLastItem
    };
  })

  .controller('MultiInputGroupController', function($scope, $timeout, multiInputService) {
    $scope.showDeleteButtonArray = [];
    $scope.content = $scope.content && $scope.content.length ? $scope.content :  [{}];

    $scope.onFocusFn = function(id) {
      $scope.showAddButton = true;
      $scope.showDeleteButtonArray[id] = true;
    };

    $scope.hideDeleteButton = function(id) {
      $timeout(function() {
        if ($scope.showDeleteButtonArray[id]) {
          $scope.showDeleteButtonArray[id] = false;
        }
      }, 200);
    };

    $scope.verifyNew = function(id) {
      $scope.showAddButton = true;
      $scope.onFocusFn(id);
    };

    this.addField = function(element) {
      $scope.showAddButton = false;
      $scope.content.push({
        value: '',
        type: $scope.types ? $scope.types[$scope.content.length % $scope.types.length] : ''
      });
      multiInputService.focusLastItem(element, '.multi-input-content .multi-input-text');
    };

    this.deleteField = function(element, id) {
      $scope.content.splice(id, 1);
      if ($scope.content.length === 0) {
        $scope.content = [{type: $scope.types[0]}];
        $scope.showAddButton = false;
      }
      multiInputService.focusLastItem(element, '.multi-input-content .multi-input-text');
    };

    $scope.isMultiTypeField = function() {
      return !!($scope.types && $scope.types.length > 0);
    };
  })

  .directive('multiInputGroup', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder',
        autocapitalize: '@multiInputAutocapitalize'
      },
      templateUrl: '/views/modules/multi-input/multi-input-group.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.addField = controller.addField.bind(null, element);
        scope.deleteField = controller.deleteField.bind(null, element);
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
      templateUrl: '/views/modules/multi-input/multi-input-group-address.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.addField = controller.addField.bind(null, element);
        scope.deleteField = controller.deleteField.bind(null, element);
      }
    };
  });
