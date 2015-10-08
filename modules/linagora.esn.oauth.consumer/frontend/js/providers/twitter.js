'use strict';

angular.module('linagora.esn.oauth')

  .constant('TWITTER_OAUTH_PATH', '/oauth/twitter/connect')

  .run(function(oauthStrategyRegistry, twitterStrategy) {
    oauthStrategyRegistry.register('twitter', twitterStrategy);
  })

  .factory('twitterStrategy', function(TWITTER_OAUTH_PATH, oauthWorkflow) {
    return function() {
      oauthWorkflow.redirect(TWITTER_OAUTH_PATH);
    };
  });
