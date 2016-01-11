'use strict';

angular.module('linagora.esn.account', ['ui.router', 'restangular', 'op.dynamicDirective', 'esn.core', 'esn.ui', 'linagora.esn.oauth', 'linagora.esn.contact.import'])
  .config(function($stateProvider, routeResolver, dynamicDirectiveServiceProvider) {
    $stateProvider.state('/accounts', {
      url: '/accounts',
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

    var account = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-account', {priority: -5});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', account);
  });
