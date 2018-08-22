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
        url: '/?q&p',
        params: {
          q: {
            value: '',
            squash: true
          },
          // provider
          p: null,
          // TODO: a stands for advanced search, MUST be an object (replaces query)
          // Add it to the url above like `'/?q&p&{a:json}'`
          // cf https://ci.linagora.com/linagora/lgs/openpaas/esn/issues/2465
          // a: null,
          // type: any, contains a complex query and is hidden from the URL for now
          // TODO: To be replaced by `a` above
          query: null
        },
        views: {
          'search-result': {
            template: '<esn-search-result></esn-search-result>'
          }
        }
      });
    }

})(angular);
