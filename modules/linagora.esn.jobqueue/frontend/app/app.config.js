(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .config(configBlock);

    function configBlock(dynamicDirectiveServiceProvider) {
      var jobQueue = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-job-queue', { priority: 10 });

      dynamicDirectiveServiceProvider.addInjection('esn-application-menu', jobQueue);
    }
})(angular);
