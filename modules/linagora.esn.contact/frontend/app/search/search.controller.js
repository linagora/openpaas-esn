(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').controller('ContactSearchController', function(
      $stateParams, $q, infiniteScrollHelper, contactSearchProviders, esnSearchQueryService) {
      var self = this;
      var query = esnSearchQueryService.buildFromState($stateParams);

      self.queryText = query.text;
      self.loadMoreElements = infiniteScrollHelper(self, function() {
        if (esnSearchQueryService.isEmpty(query)) {
          return $q.when([]);
        }

        return contactSearchProviders.get().fetch(query)();
      });
    });
})(angular);
