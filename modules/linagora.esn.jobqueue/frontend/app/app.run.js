(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .run(runBlock);

    function runBlock(esnFeatureRegistry) {
      esnFeatureRegistry.add({
        name: 'Job Queue',
        configurations: [{
          displayIn: 'Application Menu',
          name: 'application-menu:jobqueue'
        }],
        description: 'Manage job queue'
      });
    }
})(angular);
