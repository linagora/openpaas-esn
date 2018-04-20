(function(angular) {
  'use strict';

  angular.module('esn.search').component('searchResultItem', {
    bindings: {
      item: '=',
      query: '='
    },
    controller: 'searchResultItemController',
    templateUrl: '/views/modules/search/result/search-result-item.html'
  });
})(angular);
