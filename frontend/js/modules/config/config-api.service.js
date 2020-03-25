(function(angular) {
  'use strict';

  angular.module('esn.configuration')
    .factory('esnConfigApi', esnConfigApi);

  function esnConfigApi(Restangular, esnRestangular, ESN_CONFIG_SCOPE) {
    return {
      inspectPlatformConfigurations: inspectPlatformConfigurations,
      inspectDomainConfigurations: inspectDomainConfigurations,
      inspectUserConfigurations: inspectUserConfigurations,
      getPlatformConfigurations: getPlatformConfigurations,
      getDomainConfigurations: getDomainConfigurations,
      getUserConfigurations: getUserConfigurations,
      setPlatformConfigurations: setPlatformConfigurations,
      setDomainConfigurations: setDomainConfigurations,
      setUserConfigurations: setUserConfigurations
    };

    function inspectDomainConfigurations(domainId, modules) {
      var params = {
        scope: ESN_CONFIG_SCOPE.domain,
        domain_id: domainId,
        inspect: true
      };
      var configsToGet = modules.map(function(module) {
        return { name: module, keys: [] };
      });

      return getConfigurations(configsToGet, params);
    }

    function inspectPlatformConfigurations(modules) {
      var params = {
        scope: ESN_CONFIG_SCOPE.platform,
        inspect: true
      };
      var configsToGet = modules.map(function(module) {
        return { name: module, keys: [] };
      });

      return getConfigurations(configsToGet, params);
    }

    function inspectUserConfigurations(modules) {
      var params = {
        scope: ESN_CONFIG_SCOPE.user,
        inspect: true
      };
      var configsToGet = modules.map(function(module) {
        return { name: module, keys: [] };
      });

      return getConfigurations(configsToGet, params);
    }

    function getPlatformConfigurations(configsToGet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.platform
      };

      return getConfigurations(configsToGet, params);
    }

    function getDomainConfigurations(domainId, configsToGet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.domain,
        domain_id: domainId
      };

      return getConfigurations(configsToGet, params);
    }

    function getUserConfigurations(configsToGet, userId) {
      var params = {
        scope: ESN_CONFIG_SCOPE.user
      };

      if (userId) {
        params.user_id = userId;
      }

      return getConfigurations(configsToGet, params);
    }

    function setPlatformConfigurations(configsToSet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.platform
      };

      return setConfigurations(configsToSet, params);
    }

    function setDomainConfigurations(domainId, configsToSet) {
      var params = {
        scope: ESN_CONFIG_SCOPE.domain,
        domain_id: domainId
      };

      return setConfigurations(configsToSet, params);
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
