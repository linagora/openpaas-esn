(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchService', esnSearchService);

  function esnSearchService($state) {
    return {
      search: search
    };

    function search(query, provider) {
      var context = { reload: true };

      if ($state.current.name === 'search.main') {
        // So that moving next/previous does not mess with the "Back" button
        context.location = 'replace';
      }

      $state.go('search.main', {
        q: query.text,
        query: query,
        // TODO: `a` is for 'advanced'
        // a: query,
        // TODO: Have a readable fixed UID per provider ie op.contacts, op.events, op.members
        // cf https://ci.linagora.com/linagora/lgs/openpaas/esn/issues/2464
        p: provider && provider.id
      }, context);
    }
  }
})(angular);
