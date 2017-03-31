(function() {
  'use strict';

  angular.module('esn.calendar')
    .run(runBlock);

  function runBlock(esnModuleRegistry, calEventsProviders, calRegisterTimezones, CAL_MODULE_METADATA) {
    calRegisterTimezones();
    calEventsProviders.setUpSearchProviders();
    esnModuleRegistry.add(CAL_MODULE_METADATA);
  }
})();
