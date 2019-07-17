(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .directive('applicationMenuJobQueue', function(applicationMenuTemplateBuilder) {
      return {
        retrict: 'E',
        replace: true,
        template: applicationMenuTemplateBuilder('/jobqueue', 'jobqueue', 'Job Queue', 'core.features.application-menu:jobqueue')
      };
    });
})(angular);
