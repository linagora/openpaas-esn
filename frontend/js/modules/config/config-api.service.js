(function(angular) {
  'use strict';

  angular.module('esn.configuration')
    .factory('esnConfigApi', esnConfigApi);

  function esnConfigApi(Restangular, esnRestangular, ESN_CONFIG_SCOPE) {
    return {
      getDomainConfigurations: getDomainConfigurations,
      setDomainConfigurations: setDomainConfigurations,
      getPlatformConfigurations: getPlatformConfigurations,
      setPlatformConfigurations: setPlatformConfigurations,
      getUserConfigurations: getUserConfigurations,
      setUserConfigurations: setUserConfigurations
    };

    function getDomainConfigurations(domainId, configsToGet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.domain,
        domain_id: domainId
      };

      return getConfigurations(configsToGet, params);
    }

    function setDomainConfigurations(domainId, configsToSet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.domain,
        domain_id: domainId
      };

      return setConfigurations(configsToSet, params);
    }

    function getPlatformConfigurations(configsToGet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.platform
      };

      return getConfigurations(configsToGet, params);
    }

    function setPlatformConfigurations(configsToSet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.platform
      };

      return setConfigurations(configsToSet, params);
    }

    function getUserConfigurations(configsToGet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.user
      };

      return getConfigurations(configsToGet, params);
    }

    function setUserConfigurations(configsToSet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.user
      };

      return setConfigurations(configsToSet, params);
    }

    function getConfigurations(body, params) {
      return esnRestangular
        .all('configurations')
        .post(body, params)
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }

    function setConfigurations(body, params) {
      return esnRestangular
        .all('configurations')
        .customPUT(body, null, params);
    }
  }
})(angular);
