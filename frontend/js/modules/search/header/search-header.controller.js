(function() {
  'use strict';

  angular.module('esn.search')
    .controller('ESNSearchHeaderController', ESNSearchHeaderController);

  function ESNSearchHeaderController($stateParams, $state) {
    var self = this;

    self.$onInit = $onInit;
    self.search = search;

    function $onInit() {
      self.query = $stateParams.q;
    }

    function search(query, providers) {
      var context = { reload: true };

      if ($state.current.name === 'search.main') {
        // So that moving next/previous does not mess with the "Back" button
        context.location = 'replace';
      }

      $state.go('search.main', { query: query, providers: providers }, context);
    }
  }
})();
