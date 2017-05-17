'use strict';

angular.module('linagora.esn.account')
  .constant('FAB_ANCHOR_POINT', 'accounts-item-anchorpoint')
  .constant('ACCOUNT_MESSAGES', {
    delete_error: 'An error occured while deleting your social account',
    deleted: 'Your social account has been successfully deleted'
  })
  .constant('ACCOUNT_EVENTS', {
    DELETED: 'account:deleted'
  })
  .constant('OAUTH_DEFAULT_MESSAGES', {
    config_error: 'The account is not configured in the application',
    denied: 'You denied access to your account',
    error: 'An error occured when trying to access to your account',
    updated: 'Successful update of your account',
    created: 'Successfully created your account'
  })
  .constant('OAUTH_UNKNOWN_MESSAGE', 'Unknown OAuth message')
  .constant('IMPORT_URI', 'import')
  .constant('SUPPORTED_ACCOUNTS', ['oauth'])
  .constant('SUPPORTED_ACCOUNT_TYPES', {
    github: 'github',
    twitter: 'twitter',
    facebook: 'facebook',
    google: 'google'
  })
  .constant('OAUTH_SOCIAL_MESSAGES', {
    config_error: 'The social account module is not configured in the application',
    denied: 'You denied access to your social account',
    error: 'An error occured while accessing to your social account',
    updated: 'Your social account has been updated',
    created: 'Your social account has been successfully linked'
  });
