'use strict';

angular.module('linagora.esn.contact.import.twitter', [
  'restangular',
  'op.dynamicDirective',
  'esn.notification',
  'linagora.esn.contact.import'
])

.run(function(ContactImportRegistry, ContactImportMessageRegistry, TwitterContactImporter, dynamicDirectiveService, TWITTER_CONTACT_IMPORT_TYPE, TWITTER_CONTACT_IMPORT_MESSAGES) {
  ContactImportRegistry.register(TWITTER_CONTACT_IMPORT_TYPE, TwitterContactImporter);
  ContactImportMessageRegistry.register(TWITTER_CONTACT_IMPORT_TYPE, TWITTER_CONTACT_IMPORT_MESSAGES);

  dynamicDirectiveService.addInjection('account-options-items', new dynamicDirectiveService.DynamicDirective(function(scope) {
    return scope.account.provider === 'twitter';
  }, 'twitter-contact-import-menu-item'));
});
