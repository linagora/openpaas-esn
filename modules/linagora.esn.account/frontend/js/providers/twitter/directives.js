'use strict';

angular.module('linagora.esn.account')

  .directive('twitterAccountMenuItem', function(oauthStrategyRegistry, ACCOUNT_TYPE) {
    function link(scope) {
      scope.openTwitter = function() {
        oauthStrategyRegistry.get(ACCOUNT_TYPE.twitter)();
      };
    }
    return {
      replace: true,
      restrict: 'E',
      templateUrl: '/account/views/providers/twitter/add-account-item.html',
      link: link
    };
  })

  .directive('twitterAccount', function() {
    return {
      replace: true,
      restrict: 'E',
      scope: {
        account: '='
      },
      controller: 'accountController',
      templateUrl: '/account/views/providers/twitter/account.html'
    };
  });
