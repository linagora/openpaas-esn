'use strict';

angular.module('linagora.esn.contact.import.google')
  .constant('GOOGLE_CONTACT_IMPORT_TYPE', 'google')
  .constant('GOOGLE_CONTACT_IMPORT_MESSAGES', {
    ACCOUNT_ERROR: 'Failed to import Google contacts from @{{account}}, make sure your Google account is <a href="/#/controlcenter/accounts">configured</a> correctly',
    API_CLIENT_ERROR: 'Failed to import Google contacts from @{{account}}, there was a problem with the Google service',
    CONTACT_CLIENT_ERROR: 'Failed to import Google contacts from @{{account}}'
  });
