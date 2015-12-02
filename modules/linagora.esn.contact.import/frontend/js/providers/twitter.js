'use strict';

angular.module('linagora.esn.contact.import')

  .run(function(ContactImportRegistry, TwitterContactImporter, CONTACT_IMPORT_TYPES) {
    ContactImportRegistry.register(CONTACT_IMPORT_TYPES.twitter, TwitterContactImporter);
  })

  .factory('TwitterContactImporter', function(CONTACT_IMPORT_TYPES, ContactImporterService) {
    return {
      import: function() {
        return ContactImporterService.importContact(CONTACT_IMPORT_TYPES.twitter);
      }
    };
  });
