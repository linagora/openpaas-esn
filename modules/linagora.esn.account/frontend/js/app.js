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
  .config(function($stateProvider, routeResolver) {
    $stateProvider.state('controlcenter.accounts', {
      url: '/accounts',
      templateUrl: '/account/views/accounts',
      controller: 'accountListController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user'),
        accounts: function($log, accountService) {
          return accountService.getAccounts().then(function(response) {
            return response.data;
          }, function(err) {
            $log.error('Error while getting accounts', err);
          });
        },
        providers: function(_, $log, accountService, SUPPORTED_ACCOUNT_TYPES) {
          return accountService.getAccountProviders()
          .then(function(resp) {
            return _.intersection(resp.data, _.values(SUPPORTED_ACCOUNT_TYPES));
          })
          .catch(function(err) {
            $log.error('Error while getting account providers', err);
          });
        }
      }
    });

  });
