(function() {
  'use strict';

  angular.module('esn.header')
    .controller('ESNSearchHeaderSettingsController', ESNSearchHeaderSettingsController);

  function ESNSearchHeaderSettingsController($scope, searchProviders, $stateParams, $state, _) {
    init();

    function init() {
      $scope.filters = $stateParams.filters;
      $scope.all = _getAllStatus();

      if (!$scope.filters) {
        searchProviders.getAllProviderDefinitions().then(function(providers) {
          $scope.filters = providers.map(function(provider) {
            return {
              id: provider.id,
              name: provider.name,
              checked: true
            };
          });
        });
      }
    }

    function _getAllStatus() {
      return !_.findKey($scope.filters, { checked: false });
    }

    function _setFilterCheckedValue(newValue) {
      _.forEach($scope.filters, function(filter) {
        filter.checked = newValue;
      });
    }

    $scope.toggleAll = function() {
      _setFilterCheckedValue($scope.all);

      $scope.updateFilters();
    };

    $scope.resetSettings = function() {
      _setFilterCheckedValue(true);

      $scope.updateFilters();
    };

    $scope.updateFilters = function() {
      $scope.all = _getAllStatus();
    };

    $scope.updateSettings = function() {
      $scope.all = _getAllStatus();
      $state.go('search.main', { q: $scope.data.searchInput, filters: $scope.filters }, { reload: true });
    };
  }
})();
