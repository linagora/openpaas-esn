(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').controller('ContactSearchController', function(
    $stateParams,
    $q,
    infiniteScrollHelper,
    contactSearchProviders,
    esnSearchQueryService
  ) {
    var self = this;

    self.query = esnSearchQueryService.buildFromState($stateParams);
    self.queryText = self.query.text;
    self.fetchData = contactSearchProviders.get().fetch(self.query);

    self.loadMoreElements = infiniteScrollHelper(self, function() {
      if (esnSearchQueryService.isEmpty(self.query)) {
        return $q.when([]);
      }

      return self.fetchData();
    });
  });
})(angular);
