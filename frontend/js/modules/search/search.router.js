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
          // type: any, contains a complex query
          query: null,
          // type: any
          providers: null
        },
        views: {
          'search-result': {
            template: '<esn-search-result></esn-search-result>'
          }
        }
      });
    }

})(angular);
