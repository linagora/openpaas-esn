'use strict';

angular.module('linagora.esn.account')
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
  .run(function(dynamicDirectiveService, FAB_ANCHOR_POINT) {
    var directive = new dynamicDirectiveService.DynamicDirective(
      function($scope) {
        return true;
      },
      'twitter-account-menu-item'
    );
    dynamicDirectiveService.addInjection(FAB_ANCHOR_POINT, directive);
  });
