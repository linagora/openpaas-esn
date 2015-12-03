'use strict';

angular.module('linagora.esn.contact.import.twitter', [
  'restangular',
  'op.dynamicDirective',
  'esn.notification',
  'linagora.esn.contact.import'
])

.run(function(ContactImportRegistry, TwitterContactImporter, dynamicDirectiveService, TWITTER_CONTACT_IMPORT_TYPE) {
  ContactImportRegistry.register(TWITTER_CONTACT_IMPORT_TYPE, TwitterContactImporter);
  dynamicDirectiveService.addInjection('account-options-items', new dynamicDirectiveService.DynamicDirective(true, 'twitter-contact-import-menu-item'));
});
