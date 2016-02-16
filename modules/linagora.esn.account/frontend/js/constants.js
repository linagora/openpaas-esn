'use strict';

angular.module('linagora.esn.account')
  .constant('FAB_ANCHOR_POINT', 'accounts-item-anchorpoint')
  .constant('OAUTH_DEFAULT_MESSAGES', {
    denied: 'You denied access to your account',
    error: 'An error occured when trying to access to your account',
    updated: 'Successful update of your account',
    created: 'Successfully created your account'
  })
  .constant('OAUTH_MESSAGE_LEVELS', {
    denied: 'danger',
    error: 'danger',
    updated: 'info',
    created: 'info',
    default: 'info'
  })
  .constant('OAUTH_UNKNOWN_MESSAGE', 'Unknown OAuth message')
  .constant('IMPORT_URI', 'import')
  .constant('SUPPORTED_ACCOUNTS', ['oauth'])
  .constant('SUPPORTED_ACCOUNT_TYPES', {
    twitter: 'twitter',
    google: 'google'
  })
  .constant('OAUTH_SOCIAL_MESSAGES', {
    denied: 'You denied access to your social account',
    error: 'An error occured while accessing to your social account',
    updated: 'Your social account has been updated',
    created: 'Your social account has been successfully linked'
  });
