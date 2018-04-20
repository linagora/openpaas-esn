(function(angular) {
  'use strict';

  angular.module('esn.search').controller('SearchAdvancedFormController', SearchAdvancedFormController);

  function SearchAdvancedFormController($rootScope, searchContextService) {
    var self = this;

    self.$onInit = $onInit;
    self.clearSearchInput = clearSearchInput;
    self.onProviderSelected = onProviderSelected;
    self.doSearch = doSearch;

    function $onInit() {
      self.searchInput = {
        text: self.query || ''
      };

      loadProviders();

      $rootScope.$on('$stateChangeSuccess', function(event, toState) {
        // update the providers from the state
        // avoid to change when we go to search state
        if (toState.name !== 'search.main') {
          clearSearchInput();
          loadProviders();
        }
      });
    }

    function loadProviders() {
      searchContextService.getProvidersContext().then(function(providers) {
        self.providers = providers;
      });
    }

    function clearSearchInput() {
      self.searchInput = {
        text: ''
      };
    }

    function onProviderSelected(provider) {
      self.provider = provider && provider.id !== 'all' ? provider : null;
    }

    function doSearch() {
      var providers = self.provider ? [self.provider] : self.providers;

      self.search({ query: self.searchInput, providers: providers });
    }

  }
})(angular);
