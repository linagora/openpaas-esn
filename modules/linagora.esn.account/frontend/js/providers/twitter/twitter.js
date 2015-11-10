'use strict';

angular.module('linagora.esn.account')

  .run(function(dynamicDirectiveService, accountMessageRegistry, FAB_ANCHOR_POINT, OAUTH_TWITTER_MESSAGES, ContactImportRegistry, twitterImporter, ACCOUNT_TYPE) {
    var directive = new dynamicDirectiveService.DynamicDirective(
      function() {
        return true;
      },
      'twitter-account-menu-item'
    );
    dynamicDirectiveService.addInjection(FAB_ANCHOR_POINT, directive);
    accountMessageRegistry.register(ACCOUNT_TYPE.twitter, OAUTH_TWITTER_MESSAGES);
    ContactImportRegistry.register(ACCOUNT_TYPE.twitter, twitterImporter);
  });
