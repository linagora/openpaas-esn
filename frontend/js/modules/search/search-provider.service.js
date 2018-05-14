(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchProvider', esnSearchProvider);

  function esnSearchProvider(uuid4) {
    function SearchProvider(options) {
      this.options = options || {};
      this.name = options.name;
      this.templateUrl = options.templateUrl;

      if (!this.name) {
        throw new Error('name is required for search provider');
      }

      if (!this.templateUrl) {
        throw new Error('templateUrl is required to render search result');
      }

      this.id = options.id || uuid4.generate();
      this.type = options.type || (options.types && options.types[0]);
      this.types = options.types || [this.type];
      this.fetch = options.fetch;
      this.searchTemplateUrl = options.searchTemplateUrl;
      this.buildFetchContext = options.buildFetchContext;
      this.activeOn = options.activeOn || [];
      this.icon = options.icon;
    }

    SearchProvider.prototype = {
      get hasAdvancedSearch() {
        return !!this.searchTemplateUrl;
      }
    };

    return SearchProvider;
  }
})(angular);
