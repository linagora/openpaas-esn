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
    ESN_ROUTER_DEFAULT_HOME_PAGE,
    CONTROLCENTER_GENERAL_CONFIGS
  ) {
    var self = this,
        saveHandlers = [];
    var HOMEPAGE_KEY = 'homePage';

    self.$onInit = $onInit;
    self.save = save;
    self.registerSaveHandler = registerSaveHandler;

    /////

    function $onInit() {
      var homePageCandidates = controlcenterGeneralService.getHomePageCandidates();

      self.homePages = _objectWithKeysSorted(homePageCandidates);

      esnUserConfigurationService.get(CONTROLCENTER_GENERAL_CONFIGS)
        .then(function(configurations) {
          self.configurations = _buildConfigs(configurations);
        });
    }

    function save() {
      return asyncAction({
        progressing: 'Saving configuration...',
        success: 'Configuration saved',
        failure: 'Failed to save configuration'
      }, _saveConfiguration)
        .finally(_notifySaveHandlers);
    }

    function registerSaveHandler(handler) {
      saveHandlers.push(handler);
    }

    function _saveConfiguration() {
      var configurations = _.map(self.configurations, function(value, key) {
        return { name: key, value: value };
      });

      return esnUserConfigurationService.set(configurations);
    }

    function _buildConfigs(configurations) {
      var output = {};

      configurations.forEach(function(configuration) {
        output[configuration.name] = configuration.value;
      });

      if (!output[HOMEPAGE_KEY]) {
        output[HOMEPAGE_KEY] = ESN_ROUTER_DEFAULT_HOME_PAGE;
      }

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

    function _notifySaveHandlers() {
      saveHandlers.forEach(function(handler) {
        handler();
      });
    }
  }
})();
