(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .controller('controlcenterGeneralController', controlcenterGeneralController);

  function controlcenterGeneralController(esnUserConfigurationService, asyncAction, rejectWithErrorNotification, controlcenterGeneralService, _) {
    var self = this;
    var CONFIG_NAMES = ['homePage'];

    self.$onInit = $onInit;
    self.save = save;

    function $onInit() {
      var homePageCandidates = controlcenterGeneralService.getHomePageCandidates();

      self.homePages = _objectWithKeysSorted(homePageCandidates);

      esnUserConfigurationService.get(CONFIG_NAMES)
        .then(function(configurations) {
          self.configurations = _spreadConfigs(configurations);
        });
    }

    function save() {
      return asyncAction('Modification of general settings', _saveConfiguration);
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
