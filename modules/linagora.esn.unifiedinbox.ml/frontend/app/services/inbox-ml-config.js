(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox.ml')

    .factory('inboxMLConfig', function($q, esnConfig, _, INBOX_ML_MODULE_NAME, INBOX_ML_CONFIGURATION, INBOX_ML_DEFAULT_CONFIGURATIONS) {
      var inboxMLConfig = {};

      _.forEach(INBOX_ML_CONFIGURATION, function(configs, prefix) {
        var configurations = {};

        _.forEach(INBOX_ML_CONFIGURATION[prefix], function(value, key) {
          configurations[value] = esnConfig(INBOX_ML_MODULE_NAME + '.' + prefix + '.' + value, INBOX_ML_DEFAULT_CONFIGURATIONS[prefix][key]);
        });

        inboxMLConfig[prefix] = $q.all(configurations);
      });

      return inboxMLConfig;
    });

})();
