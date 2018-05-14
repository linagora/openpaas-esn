(function(angular) {
  'use strict';

  angular.module('esn.search').component('esnSearchResult', {
    templateUrl: '/views/modules/search/result/search-result.html',
    controller: 'ESNSearchResultController',
    controllerAs: 'ctrl'
  });
})(angular);
