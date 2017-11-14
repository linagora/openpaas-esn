'use strict';

angular.module('linagora.esn.account', [
  'esn.router',
  'restangular',
  'esn.lodash-wrapper',
  'op.dynamicDirective',
  'esn.core',
  'esn.ui',
  'esn.http',
  'linagora.esn.oauth.consumer'])
  .config(function($stateProvider, routeResolver, dynamicDirectiveServiceProvider) {
    $stateProvider.state('controlcenter.accounts', {
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

    var accountControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'controlcenter-menu-account', {priority: -2});
    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', accountControlCenterMenu);
  });
