(function(angular) {
  'use strict';

  angular.module('esn.search').component('esnSearchResultItem', {
    bindings: {
      item: '=',
      query: '='
    },
    controller: 'ESNSearchResultItemController',
    templateUrl: '/views/modules/search/result/search-result-item.html'
  });
})(angular);
