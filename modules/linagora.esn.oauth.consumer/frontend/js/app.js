'use strict';

angular.module('linagora.esn.oauth.consumer', ['esn.lodash-wrapper'])
  .constant('SUPPORTED_ACCOUNT_TYPES', {
    twitter: 'twitter',
    google: 'google',
    github: 'github'
  })
  .run(function(oauthStrategyRegistry, SUPPORTED_ACCOUNT_TYPES, _, oauthWorkflow) {
    _.forIn(SUPPORTED_ACCOUNT_TYPES, function(item) {
      oauthStrategyRegistry.register(item, function() {
        oauthWorkflow.redirect(['oauth', item, 'connect'].join('/'));
      });
    });
  });
