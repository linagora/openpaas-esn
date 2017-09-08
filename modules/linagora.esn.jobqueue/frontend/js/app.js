'use strict';

angular.module('linagora.esn.jobqueue', [
  'esn.application-menu',
  'op.dynamicDirective',
  'esn.feature-registry'
  ])

.config(function(dynamicDirectiveServiceProvider) {
  var jobQueue = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-job-queue', {priority: 10});
  dynamicDirectiveServiceProvider.addInjection('esn-application-menu', jobQueue);
})
.run(function(esnFeatureRegistry) {
  esnFeatureRegistry.add({
    name: 'Job Queue',
    configurations: [{
      displayIn: 'Application Menu',
      name: 'application-menu:jobqueue'
    }],
    description: 'Manage job queue'
  });
});
