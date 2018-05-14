(function(angular) {
  'use strict';

  angular.module('esn.search').controller('ESNSearchAdvancedFormController', ESNSearchAdvancedFormController);

  function ESNSearchAdvancedFormController($rootScope, esnSearchContextService) {
    var self = this;

    self.$onInit = $onInit;
    self.clearSearchQuery = clearSearchQuery;
    self.onProviderSelected = onProviderSelected;
    self.doSearch = doSearch;

    function $onInit() {
      self.searchQuery = {
        text: self.query || ''
      };

      loadProviders();

      $rootScope.$on('$stateChangeSuccess', function(event, toState) {
        // update the providers from the state
        // avoid to change when we go to search state
        if (toState.name !== 'search.main') {
          clearSearchQuery();
          loadProviders();
        }
      });
    }

    function loadProviders() {
      esnSearchContextService.getProvidersContext().then(function(providers) {
        self.providers = providers;
      });
    }

    function clearSearchQuery() {
      self.searchQuery = {
        text: ''
      };
    }

    function onProviderSelected(provider) {
      self.provider = provider;
    }

    function doSearch() {
      var providers = self.provider ? [self.provider] : self.providers;

      self.search({ query: self.searchQuery, providers: providers });
    }
  }
})(angular);
