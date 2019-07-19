(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .component('jobqueueConfigForm', {
      templateUrl: '/jobqueue/app/config-form/jobqueue-config-form.html',
      bindings: {
        configurations: '='
      }
    });
})(angular);
