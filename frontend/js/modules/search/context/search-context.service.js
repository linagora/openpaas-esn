(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchContextService', esnSearchContextService);

  function esnSearchContextService(esnI18nService, searchProviders, $state, $stateParams) {
    return {
      getProvidersContext: getProvidersContext,
      isActive: isActive
    };

    function getProvidersContext() {
      return searchProviders.getAll()
        .then(function(providers) {
          return providers.map(function(provider) {
            provider.active = isActive(provider);
            provider.displayName = esnI18nService.translate(provider.name).toString();

            return provider;
          });
        });
    }

    function isActive(provider) {
      return ($stateParams.p && $stateParams.p === provider.uid) ||
        (provider.activeOn || []).some(function(active) {
          return $state.includes(active);
        });
    }
  }
})(angular);
