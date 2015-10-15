'use strict';

angular.module('linagora.esn.account')
  .constant('OAUTH_TWITTER_MESSAGES', {
    denied: 'You denied access to your twitter account',
    error: 'An error occured while accessing to your twitter account',
    updated: 'Your twitter account has been updated',
    created: 'Your twitter account has been successfully linked'
  })
  .directive('twitterAccountMenuItem', function(oauthStrategyRegistry) {
    function link($scope) {
      $scope.openTwitter = function() {
        oauthStrategyRegistry.get('twitter')();
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
      templateUrl: '/account/views/providers/twitter/account.html'
    };
  })
  .run(function(dynamicDirectiveService, accountMessageRegistry, FAB_ANCHOR_POINT, OAUTH_TWITTER_MESSAGES) {
    var directive = new dynamicDirectiveService.DynamicDirective(
      function($scope) {
        return true;
      },
      'twitter-account-menu-item'
    );
    dynamicDirectiveService.addInjection(FAB_ANCHOR_POINT, directive);
    accountMessageRegistry.register('twitter', OAUTH_TWITTER_MESSAGES);
  });
