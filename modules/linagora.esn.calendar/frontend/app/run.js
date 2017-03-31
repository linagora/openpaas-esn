(function() {
  'use strict';

  angular.module('esn.calendar')
    .run(runBlock);

  function runBlock(esnModuleRegistry, calEventsProviders, calRegisterTimezones, CALENDAR_MODULE_METADATA) {
    calRegisterTimezones();
    calEventsProviders.setUpSearchProviders();
    esnModuleRegistry.add(CALENDAR_MODULE_METADATA);
  }
})();
