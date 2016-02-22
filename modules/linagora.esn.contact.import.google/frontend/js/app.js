'use strict';

angular.module('linagora.esn.contact.import.google', [
  'restangular',
  'op.dynamicDirective',
  'esn.notification',
  'linagora.esn.contact.import'])

.run(function(ContactImportRegistry, ContactImportMessageRegistry, GoogleContactImporter, dynamicDirectiveService, GOOGLE_CONTACT_IMPORT_TYPE, GOOGLE_CONTACT_IMPORT_MESSAGES) {
  ContactImportRegistry.register(GOOGLE_CONTACT_IMPORT_TYPE, GoogleContactImporter);
  ContactImportMessageRegistry.register(GOOGLE_CONTACT_IMPORT_TYPE, GOOGLE_CONTACT_IMPORT_MESSAGES);

  dynamicDirectiveService.addInjection('account-options-items', new dynamicDirectiveService.DynamicDirective(function(scope) {
    return scope.account.provider === 'google';
  }, 'google-contact-import-menu-item'));
});
