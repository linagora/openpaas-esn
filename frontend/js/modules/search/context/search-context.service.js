(function(angular) {
  'use strict';

  angular.module('esn.search').factory('searchContextService', searchContextService);

  function searchContextService(searchProviders, $state) {
    return {
      getProvidersContext: getProvidersContext,
      isActive: isActive
    };

    function getProvidersContext() {
      return searchProviders.getAll()
        .then(function(providers) {
          return providers.map(function(provider) {
            return {
              id: provider.id,
              name: provider.name,
              active: isActive(provider),
              icon: '/unifiedinbox/images/inbox-icon.svg'
            };
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
