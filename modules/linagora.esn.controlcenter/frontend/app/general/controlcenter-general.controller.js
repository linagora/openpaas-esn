(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .controller('controlcenterGeneralController', controlcenterGeneralController);

  function controlcenterGeneralController(esnUserConfigurationService, asyncAction, rejectWithErrorNotification, controlcenterGeneralService, _) {
    var self = this;

    self.$onInit = $onInit;
    self.onFormSubmit = onFormSubmit;

    function $onInit() {
      var CONFIG_NAMES = ['homePage'];
      var homePageCandidates = controlcenterGeneralService.getHomePageCandidates();

      self.configurations = {};
      self.homePages = _objectWithKeysSorted(homePageCandidates);

      esnUserConfigurationService.get(CONFIG_NAMES)
        .then(function(configurations) {
          _extractConfigs(configurations);
        });
    }

    function _extractConfigs(configurations) {
      configurations.forEach(function(configuration) {
        self.configurations[configuration.name] = configuration.value;
      });
    }

    function onFormSubmit(form) {
      if (form && form.$valid) {
        return asyncAction('Modification of general settings', _saveConfiguration)
          .then(function() {
            form.$setPristine();
            form.$setUntouched();
          });
      }

      return rejectWithErrorNotification('Form is invalid!');
    }

    function _saveConfiguration() {
      var configurations = _.map(self.configurations, function(value, key) {
        return { name: key, value: value };
      });

      return esnUserConfigurationService.set(configurations);
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
