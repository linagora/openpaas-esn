(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .controller('controlcenterGeneralController', controlcenterGeneralController);

  function controlcenterGeneralController(
    esnUserConfigurationService,
    asyncAction,
    rejectWithErrorNotification,
    controlcenterGeneralService,
    _,
    CONTROLCENTER_GENERAL_CONFIGS
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.save = save;

    function $onInit() {
      var homePageCandidates = controlcenterGeneralService.getHomePageCandidates();

      self.homePages = _objectWithKeysSorted(homePageCandidates);

      esnUserConfigurationService.get(CONTROLCENTER_GENERAL_CONFIGS)
        .then(function(configurations) {
          self.configurations = _spreadConfigs(configurations);
        });
    }

    function save() {
      return asyncAction({
        progressing: 'Saving configuration...',
        success: 'Configuration saved',
        failure: 'Failed to save configuration'
      }, _saveConfiguration);
    }

    function _saveConfiguration() {
      var configurations = _.map(self.configurations, function(value, key) {
        return { name: key, value: value };
      });

      return esnUserConfigurationService.set(configurations);
    }

    function _spreadConfigs(configurations) {
      var output = {};

      configurations.forEach(function(configuration) {
        output[configuration.name] = configuration.value;
      });

      return output;
    }

    function _objectWithKeysSorted(object) {
      var result = {};
      var keysSorted = Object.keys(object).sort();

      _.forEach(keysSorted, function(key) {
        result[key] = object[key];
      });

      return result;
    }
  }
})();
