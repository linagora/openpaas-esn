(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchProviderSelectController', ESNSearchProviderSelectController);

  function ESNSearchProviderSelectController() {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.selectAll = !(self.providers || []).some(function(provider) {
        return provider.active;
      });
    }
  }
})();
