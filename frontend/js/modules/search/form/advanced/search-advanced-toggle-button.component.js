(function(angular) {
  'use strict';

  angular.module('esn.search').component('esnSearchAdvancedToggleButton', {
    templateUrl: '/views/modules/search/form/advanced/search-advanced-toggle-button.html',
    controller: 'ESNSearchAdvancedToggleButtonController',
    controllerAs: 'ctrl',
    bindings: {
      provider: '=',
      query: '<',
      search: '&'
    }
  });
})(angular);
