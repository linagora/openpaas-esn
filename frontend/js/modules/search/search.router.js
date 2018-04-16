(function(angular) {
  'use strict';

  angular.module('esn.search').config(searchRouter);

  function searchRouter($stateProvider) {
    $stateProvider
      .state('search', {
        url: '/search',
        abstract: true,
        templateUrl: '/views/modules/search/index.html'
      })
      .state('search.main', {
        url: '?q',
        params: {
          q: {
            value: '',
            squash: true
          },
          filters: null
        },
        views: {
          'search-result': {
            templateUrl: '/views/modules/search/result/search-result.html',
            controller: 'searchResultController'
          }
        }
      });
    }

})(angular);
