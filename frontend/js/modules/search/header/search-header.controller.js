(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchHeaderController', ESNSearchHeaderController);

  function ESNSearchHeaderController($stateParams, ESNSearchService) {
    var self = this;

    self.$onInit = $onInit;
    self.search = search;

    function $onInit() {
      self.query = $stateParams.q;
    }

    function search(query, providers) {
      ESNSearchService.search(query, providers);
    }
  }
})();
