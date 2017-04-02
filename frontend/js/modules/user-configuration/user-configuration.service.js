(function() {
  'use strict';

  angular.module('esn.user-configuration')
    .factory('esnUserConfigurationService', esnUserConfigurationService);

    function esnUserConfigurationService(esnRestangular, _, ESN_USER_CONFIGURATION_DEFAULT_MODULE) {
      var defaultModule = ESN_USER_CONFIGURATION_DEFAULT_MODULE;

      return {
        get: get,
        set: set
      };

      function getConfigurations(query) {
        return esnRestangular
          .one('user')
          .all('configuration')
          .customPOST(query);
      }

      function setConfigurations(query) {
        return esnRestangular
          .one('user')
          .all('configuration')
          .customPUT(query);
      }

      function get(keys, module) {
        if (!module) {
          module = defaultModule;
        }

        var query = [{
          name: module,
          keys: keys
        }];

        return getConfigurations(query).then(function(response) {
          return _.find(response.data, { name: module }).configurations;
        });
      }

      function set(configurations, module) {
        var query = [{
          name: module || defaultModule,
          configurations: configurations
        }];

        return setConfigurations(query);
      }
    }
})();
