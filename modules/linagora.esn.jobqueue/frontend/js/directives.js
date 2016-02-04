'use strict';

angular.module('linagora.esn.jobqueue')
  .directive('applicationMenuJobQueue', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/jobqueue', 'mdi-worker', 'Job Queue')
    };
  });
