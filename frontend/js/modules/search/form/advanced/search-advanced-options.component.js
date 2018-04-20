(function(angular) {
  'use strict';

  angular.module('esn.search').component('searchAdvancedOptions', {
    templateUrl: '/views/modules/search/form/advanced/search-advanced-options.html',
    controller: 'SearchAdvancedOptionsController',
    controllerAs: 'ctrl',
    bindings: {
      provider: '='
    }
  });
})(angular);
