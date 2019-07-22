(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .directive('applicationMenuJobQueue', function(applicationMenuTemplateBuilder, JOBQUEUE_MODULE_METADATA) {
      return {
        retrict: 'E',
        replace: true,
        template: applicationMenuTemplateBuilder(
          '/jobqueue',
          JOBQUEUE_MODULE_METADATA.icon,
          'Job Queue',
          'linagora.esn.jobqueue.features.isUserInterfaceEnabled',
          JOBQUEUE_MODULE_METADATA.isDisplayedByDefault
        )
      };
    });
})(angular);
