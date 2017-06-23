(function() {
  'use strict';

  angular.module('esn.user-configuration')
    .factory('esnUserConfigurationService', esnUserConfigurationService);

    function esnUserConfigurationService(esnConfigApi, _, ESN_USER_CONFIGURATION_DEFAULT_MODULE) {
      return {
        get: get,
        set: set
      };

      function get(keys, module) {
        module = module || ESN_USER_CONFIGURATION_DEFAULT_MODULE;

        return esnConfigApi
          .getUserConfigurations([{
            name: module,
            keys: keys
          }])
          .then(function(data) {
            return (_.find(data, { name: module }) || {}).configurations;
          });
      }

      function set(configurations, module) {
        return esnConfigApi
          .setUserConfigurations([{
            name: module || ESN_USER_CONFIGURATION_DEFAULT_MODULE,
            configurations: configurations
          }]);
      }
    }
})();
