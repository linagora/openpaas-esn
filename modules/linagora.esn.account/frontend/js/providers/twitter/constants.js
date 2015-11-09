'use strict';

angular.module('linagora.esn.account')
  .constant('OAUTH_TWITTER_MESSAGES', {
    denied: 'You denied access to your Twitter account',
    error: 'An error occured while accessing to your Twitter account',
    updated: 'Your Twitter account has been updated',
    created: 'Your Twitter account has been successfully linked'
  })
  .constant('ACCOUNT_TYPE', {
    twitter: 'twitter'
  });

