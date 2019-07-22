(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .run(runBlock);

    function runBlock(dynamicDirectiveService, session) {
      session.ready.then(function() {
        if (session.user.isPlatformAdmin) {
          var jobQueue = new dynamicDirectiveService.DynamicDirective(true, 'application-menu-job-queue', { priority: 10 });

          dynamicDirectiveService.addInjection('esn-application-menu', jobQueue);
        }
      });
    }
})(angular);
