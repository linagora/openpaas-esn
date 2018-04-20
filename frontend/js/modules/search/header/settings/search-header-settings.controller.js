(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchHeaderSettingsController', ESNSearchHeaderSettingsController);

  function ESNSearchHeaderSettingsController($scope, searchProviders, $stateParams, $state) {
    init();

    $scope.resetSearch = resetSearch;
    $scope.updateSettings = updateSettings;

    function init() {
    }

    function resetSearch() {

    }

    function updateSettings() {
      $state.go('search.main', { q: $scope.data.searchInput, filters: $scope.filters }, { reload: true });
    }
  }
})();
