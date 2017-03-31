(function() {
  'use strict';

  angular.module('esn.calendar')
    .run(runBlock);

  function runBlock(esnModuleRegistry, calRegisterTimezones, CAL_MODULE_METADATA) {
    calRegisterTimezones();
    esnModuleRegistry.add(CAL_MODULE_METADATA);
  }
})();
