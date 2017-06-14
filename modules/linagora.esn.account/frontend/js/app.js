'use strict';

angular.module('linagora.esn.account', [
  'esn.router',
  'restangular',
  'esn.lodash-wrapper',
  'op.dynamicDirective',
  'esn.core',
  'esn.ui',
  'esn.http',
  'linagora.esn.oauth'])
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
  })
  .run(function(dynamicDirectiveService, accountMessageRegistry, FAB_ANCHOR_POINT, SUPPORTED_ACCOUNT_TYPES, socialHelper, _) {
    _.forIn(SUPPORTED_ACCOUNT_TYPES, function(item) {
      var options = {
        attributes: [
          {
            name: 'type',
            value: item
          }
        ]
      };
      var directive = new dynamicDirectiveService.DynamicDirective(
        function() {
          return true;
        }, 'account-menu-item', options);
      dynamicDirectiveService.addInjection(FAB_ANCHOR_POINT, directive);
      accountMessageRegistry.register(item, socialHelper.getAccountMessages(item));
    });
  });
