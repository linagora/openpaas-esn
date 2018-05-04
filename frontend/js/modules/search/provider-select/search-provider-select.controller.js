(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchProviderSelectController', ESNSearchProviderSelectController);

  function ESNSearchProviderSelectController(esnI18nService) {
    var self = this;

    self.$onChanges = $onChanges;
    self.$onInit = $onInit;

    function $onChanges() {
      // change is coming from 'SearchAdvancedFormController'
      // which reloads self.providers on route change
      select();
    }

    function $onInit() {
      (self.providers || []).forEach(function(provider) {
        provider.displayName = esnI18nService.translate(provider.name).toString();
      });

      select();
    }

    function select() {
      self.selectedProvider = undefined;

      var activeProviders = (self.providers || []).filter(function(provider) {
        return provider.active;
      });

      if (activeProviders.length) {
        self.selectedProvider = activeProviders[0];
      }

      self.onProviderSelected({ provider: self.selectedProvider });
    }
  }
})();
