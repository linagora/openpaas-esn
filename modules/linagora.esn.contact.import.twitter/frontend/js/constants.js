'use strict';

angular.module('linagora.esn.contact.import.twitter')
  .constant('TWITTER_CONTACT_IMPORT_TYPE', 'twitter')
  .constant('TWITTER_CONTACT_IMPORT_MESSAGES', {
    ACCOUNT_ERROR: 'Failed to import Twitter followings from @{{account}}, make sure your Twitter account is <a href="/#/accounts">configured</a> correctly',
    API_CLIENT_ERROR: 'Failed to import Twitter followings from @{{account}}, there was a problem with the Twitter service',
    CONTACT_CLIENT_ERROR: 'Failed to import Twitter followings from @{{account}}'
  });
