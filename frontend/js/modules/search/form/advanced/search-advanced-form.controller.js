(function(angular) {
  'use strict';

  angular.module('esn.search').controller('ESNSearchAdvancedFormController', ESNSearchAdvancedFormController);

  function ESNSearchAdvancedFormController($stateParams, $rootScope, esnSearchContextService) {
    var self = this;

    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;
    self.clearSearchQuery = clearSearchQuery;
    self.onProviderSelected = onProviderSelected;
    self.doSearch = doSearch;

    var removeStateListener = $rootScope.$on('$stateChangeSuccess', function(event, toState) {
      // update the providers from the state
      // avoid to change when we go to search state
      if (toState.name !== 'search.main') {
        clearSearchQuery();
        loadProviders();
      } else {
        // For some reason it will not work if not set when coming back from a search result...
        self.searchQuery.text = $stateParams.q;
      }
    });

    function $onInit() {
      self.searchQuery = { text: $stateParams.q };
      loadProviders();
    }

    function $onDestroy() {
      removeStateListener();
    }

    function loadProviders() {
      esnSearchContextService.getProvidersContext().then(function(providers) {
        self.providers = providers;
      });
    }

    function clearSearchQuery() {
      self.searchQuery.text = '';
    }

    function onProviderSelected(provider) {
      self.provider = provider;
    }

    function doSearch() {
      self.search({ query: self.searchQuery, provider: self.provider || null });
    }
  }
})(angular);
