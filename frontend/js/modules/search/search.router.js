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
        url: '/?q&p&{a:json}',
        params: {
          q: {
            value: '',
            squash: true
          },
          // provider
          p: {
            value: '',
            squash: true
          },
          // 'a' stands for 'A'dvanced search, MUST be an object
          a: {
            value: {},
            squash: true
          }
        },
        views: {
          'search-result': {
            template: '<esn-search-result></esn-search-result>'
          }
        }
      });
    }

})(angular);
