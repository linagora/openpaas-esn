(function(angular) {
  'use strict';

  angular.module('esn.community').run(runBlock);

  function runBlock(
    esnModuleRegistry,
    COMMUNITY_MODULE_METADATA
  ) {
    esnModuleRegistry.add(COMMUNITY_MODULE_METADATA);
  }
})(angular);
