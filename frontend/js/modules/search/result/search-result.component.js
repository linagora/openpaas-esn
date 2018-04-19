(function(angular) {
  'use strict';

  angular.module('esn.search').component('searchResult', {
    templateUrl: '/views/modules/search/result/search-result.html',
    controller: 'searchResultController',
    controllerAs: 'ctrl'
  });
})(angular);
