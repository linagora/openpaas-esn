(function() {
  'use strict';

  angular
    .module('esn.search')
    .component('searchProviderSelect', {
      templateUrl: '/views/modules/search/provider-select/search-provider-select.html',
      controller: 'ESNSearchProviderSelectController',
      controllerAs: 'ctrl',
      bindings: {
        providers: '<',
        onProviderSelected: '&'
      }
    });
})();
