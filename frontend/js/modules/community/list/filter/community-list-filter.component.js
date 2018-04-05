(function() {
  'use strict';

  angular.module('esn.community').component('communityListFilter', {
    controller: 'communityListFilterController',
    bindings: {
      onChange: '&',
      filter: '<'
    },
    templateUrl: '/views/modules/community/list/filter/community-list-filter.html'
  });
})();
