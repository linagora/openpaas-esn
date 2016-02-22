'use strict';

angular.module('linagora.esn.contact.import.google')

.factory('GoogleContactImporter', function(GOOGLE_CONTACT_IMPORT_TYPE, ContactImporterService) {
  return {
    import: function(account) {
      return ContactImporterService.import(GOOGLE_CONTACT_IMPORT_TYPE, account);
    }
  };
});
