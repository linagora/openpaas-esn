(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchContextService', esnSearchContextService);

  function esnSearchContextService(searchProviders, $state) {
    return {
      getProvidersContext: getProvidersContext,
      isActive: isActive
    };

    function getProvidersContext() {
      return searchProviders.getAll()
        .then(function(providers) {
          return providers.map(function(provider) {
            provider.active = isActive(provider);

            return provider;
          });
        });
    }

    function isActive(provider) {
      return (provider.activeOn || []).some(function(active) {
        return $state.includes(active);
      });
    }
  }
})(angular);
