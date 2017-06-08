(function() {
  'use strict';

  angular.module('esn.header')
    .controller('ESNSearchHeaderController', ESNSearchHeaderController);

  function ESNSearchHeaderController($stateParams, $state, $scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      $scope.data = {
        searchInput: $stateParams.q
      };
    }

    $scope.clearSearchInput = function() {
      $scope.data.searchInput = '';
    };

    $scope.search = function() {
      if ($state.current.name === 'search.main') {
        $state.go('search.main',
          { q: $scope.data.searchInput, filters: $stateParams.filters },
          { reload: true, location: 'replace' // So that moving next/previous does not mess with the "Back" button
        });
      } else {
        $state.go('search.main', { q: $scope.data.searchInput, filters: $stateParams.filters }, { reload: true });
      }
    };
  }
})();
