'use strict';

angular.module('linagora.esn.contact.import')
  .constant('CONTACT_IMPORT_URL', '/import/api')
  .constant('CONTACT_IMPORT_SIO_NAMESPACE', '/contact-import')
  .constant('CONTACT_IMPORT_SIO_EVENTS', {
    ACCOUNT_ERROR: 'contact:import:account:error',
    API_CLIENT_ERROR: 'contact:import:api:error',
    CONTACT_CLIENT_ERROR: 'contact:import:contact:error'
  })
  .constant('CONTACT_IMPORT_DEFAULT_MESSAGES', {
    ACCOUNT_ERROR: 'Failed to import contacts, make sure your external account is <a href="/#/controlcenter/accounts">configured</a> correctly',
    API_CLIENT_ERROR: 'Failed to import contacts, there was a problem with the external service',
    CONTACT_CLIENT_ERROR: 'Failed to import contacts'
  })
  .constant('CONTACT_IMPORT_UNKNOWN_MESSAGE', 'Unknown contact import message');
