(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchProviderSelectController', ESNSearchProviderSelectController);

  function ESNSearchProviderSelectController() {
    var self = this;

    self.$onChanges = $onChanges;
    self.$onInit = $onInit;

    function $onChanges() {
      // change is coming from 'SearchAdvancedFormController'
      // which reloads self.providers on route change
      select();
    }

    function $onInit() {
      // this is needed because we track select options by id
      self.allProviders = { id: 'all' };
      select();
    }

    function select() {
      self.selectedProvider = undefined;

      var activeProviders = (self.providers || []).filter(function(provider) {
        return provider.active;
      });

      self.selectedProvider = activeProviders.length ? activeProviders[0] : self.allProviders;
      self.onProviderSelected({ provider: self.selectedProvider });
    }
  }
})();
