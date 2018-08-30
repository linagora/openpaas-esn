(function(angular) {
  'use strict';

  angular.module('esn.user-notification').run(runBlock);

  function runBlock(esnFeatureRegistry) {
    esnFeatureRegistry.add({
      name: 'User Notification',
      configurations: [{
        displayIn: 'Header',
        name: 'header:user-notification'
      }],
      description: 'Display notification bell'
    });
  }

})(angular);
