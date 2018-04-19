(function(angular) {
  'use strict';

  angular.module('esn.search').controller('SearchAdvancedFormController', SearchAdvancedFormController);

  function SearchAdvancedFormController(searchContextService) {
    var self = this;

    self.$onInit = $onInit;
    self.clearSearchInput = clearSearchInput;
    self.onProviderSelected = onProviderSelected;
    self.doSearch = doSearch;

    function $onInit() {
      self.searchInput = {
        text: self.query || ''
      };

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
      self.provider = provider;
    }

    function doSearch() {
      var providers = self.provider ? [self.provider] : self.providers;

      self.search({ query: self.searchInput, providers: providers });
    }

  }
})(angular);
