'use strict';

angular.module('linagora.esn.contact.import.twitter')

.factory('TwitterContactImporter', function(TWITTER_CONTACT_IMPORT_TYPE, ContactImporterService) {
  return {
    import: function(account) {
      return ContactImporterService.importContact(TWITTER_CONTACT_IMPORT_TYPE, account);
    }
  };
});
