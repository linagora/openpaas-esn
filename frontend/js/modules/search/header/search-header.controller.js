(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchHeaderController', ESNSearchHeaderController);

  function ESNSearchHeaderController($stateParams, esnSearchService) {
    var self = this;

    self.$onInit = $onInit;
    self.search = search;

    function $onInit() {
      self.query = $stateParams.q;
    }

    function search(query, provider) {
      esnSearchService.search(query, provider);
    }
  }
})();
