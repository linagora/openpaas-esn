(function(angular) {
  'use strict';

  angular.module('esn.search').component('searchAdvancedToggleButton', {
    templateUrl: '/views/modules/search/form/advanced/search-advanced-toggle-button.html',
    controller: 'SearchAdvancedToggleButtonController',
    controllerAs: 'ctrl',
    bindings: {
      provider: '=',
      query: '=',
      search: '&'
    }
  });
})(angular);
