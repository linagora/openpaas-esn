(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchProvider', esnSearchProvider);

  function esnSearchProvider(uuid4) {
    function SearchProvider(options) {
      this.options = options || {};
      this.name = options.name;
      this.templateUrl = options.templateUrl;
      this.uid = options.uid;

      if (!this.name) {
        throw new Error('name is required for search provider');
      }

      if (!this.templateUrl) {
        throw new Error('templateUrl is required to render search result');
      }

      if (!this.uid) {
        throw new Error('uid is required for search provider');
      }

      this.id = options.id || uuid4.generate();
      this.type = options.type || (options.types && options.types[0]);
      this.types = options.types || [this.type];
      this.fetch = options.fetch;
      this.searchTemplateUrl = options.searchTemplateUrl;
      this.buildFetchContext = options.buildFetchContext;
      this.onSubmit = options.onSubmit;
      this.cleanQuery = options.cleanQuery;
      this.activeOn = options.activeOn || [];
      this.icon = options.icon;
      this.placeHolder = options.placeHolder;
    }

    SearchProvider.prototype = {
      get hasAdvancedSearch() {
        return !!this.searchTemplateUrl;
      }
    };

    return SearchProvider;
  }
})(angular);
