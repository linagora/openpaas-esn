'use strict';

angular.module('linagora.esn.jobqueue', [
  'esn.application-menu',
  'op.dynamicDirective'
  ])

.config(function(dynamicDirectiveServiceProvider) {
  var jobQueue = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-job-queue', {priority: 10});
  dynamicDirectiveServiceProvider.addInjection('esn-application-menu', jobQueue);
});
