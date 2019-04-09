(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);

  function runBlock(
    esnModuleRegistry,
    CONTACT_MODULE_METADATA
  ) {
    esnModuleRegistry.add(CONTACT_MODULE_METADATA);
  }
})(angular);
