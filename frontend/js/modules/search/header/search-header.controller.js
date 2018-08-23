(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchHeaderController', ESNSearchHeaderController);

  function ESNSearchHeaderController(esnSearchService) {
    var self = this;

    self.search = search;

    function search(query, provider) {
      esnSearchService.search(query, provider);
    }
  }
})();
