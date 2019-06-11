(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('applicationMenuContact', applicationMenuContact);

  function applicationMenuContact(
    applicationMenuTemplateBuilder,
    CONTACT_MODULE_METADATA
  ) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/contact', { url: CONTACT_MODULE_METADATA.icon }, 'Contacts', 'core.modules.linagora.esn.contact.enabled', CONTACT_MODULE_METADATA.isDisplayedByDefault)
    };
  }
})(angular);
