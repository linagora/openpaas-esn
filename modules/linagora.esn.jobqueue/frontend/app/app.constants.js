(function(angular) {
  'use strict';

  angular.module('linagora.esn.jobqueue')
    .constant('JOBQUEUE_MODULE_METADATA', {
      id: 'linagora.esn.jobqueue',
      title: 'Job Queue',
      icon: '/jobqueue/images/application.png',
      config: {
        template: 'jobqueue-config-form',
        displayIn: {
          user: false,
          domain: false,
          platform: true
        }
      },
      disableable: false,
      isDisplayedByDefault: false
    });
})(angular);
