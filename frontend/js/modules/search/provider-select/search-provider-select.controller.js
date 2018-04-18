(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchProviderSelectController', ESNSearchProviderSelectController);

  function ESNSearchProviderSelectController(searchContextService, $scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      searchContextService.getProvidersContext().then(function(providers) {
        $scope.filters = providers;
      });
    }
  }
})();
