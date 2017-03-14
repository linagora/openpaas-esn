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

      function get(keys) {
        var query = [{
          name: defaultModule,
          keys: keys
        }];

        return getConfigurations(query).then(function(response) {
          var modules = response.data;
          var module = _.find(modules, { name: defaultModule });

          return module.configurations;
        });
      }

      function set(configurations) {
        var query = [{
          name: defaultModule,
          configurations: configurations
        }];

        return setConfigurations(query);
      }
    }
})();
