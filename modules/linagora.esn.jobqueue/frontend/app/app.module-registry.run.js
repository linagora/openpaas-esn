(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .run(runBlock);

    function runBlock(esnModuleRegistry, JOBQUEUE_MODULE_METADATA) {
      esnModuleRegistry.add(JOBQUEUE_MODULE_METADATA);
    }
})(angular);
