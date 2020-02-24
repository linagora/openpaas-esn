(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile').run(runBlock);

  function runBlock(
    esnModuleRegistry,
    PROFILE_MODULE_METADATA
  ) {
    esnModuleRegistry.add(PROFILE_MODULE_METADATA);
  }
})(angular);
