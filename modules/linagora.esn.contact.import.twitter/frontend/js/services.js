'use strict';

angular.module('linagora.esn.contact.import.twitter')

.factory('TwitterContactImporter', function(TWITTER_CONTACT_IMPORT_TYPE, ContactImporterService) {
  return {
    import: function() {
      return ContactImporterService.importContact(TWITTER_CONTACT_IMPORT_TYPE);
    }
  };
});
