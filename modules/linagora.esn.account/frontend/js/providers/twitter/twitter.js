'use strict';

angular.module('linagora.esn.account')

  .run(function(dynamicDirectiveService, accountMessageRegistry, FAB_ANCHOR_POINT, OAUTH_TWITTER_MESSAGES, ACCOUNT_TYPES) {
    var directive = new dynamicDirectiveService.DynamicDirective(
      function() {
        return true;
      },
      'twitter-account-menu-item'
    );
    dynamicDirectiveService.addInjection(FAB_ANCHOR_POINT, directive);
    accountMessageRegistry.register(ACCOUNT_TYPES.twitter, OAUTH_TWITTER_MESSAGES);
  });
