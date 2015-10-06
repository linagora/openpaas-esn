'use strict';

angular.module('linagora.esn.account', ['restangular', 'op.dynamicDirective'])
  .config(function($routeProvider, routeResolver) {
  $routeProvider.when('/accounts', {
    templateUrl: '/account/views/accounts',
    controller: 'accountListController',
    resolve: {
      domain: routeResolver.session('domain'),
      user: routeResolver.session('user'),
      accounts: function($log, $location, accountService) {
        return accountService.getAccounts().then(function(response) {
          return response.data;
        }, function(err) {
          $log.error('Error while getting accounts', err);
          $location.path('/');
        });
      }
    }
  });
});
