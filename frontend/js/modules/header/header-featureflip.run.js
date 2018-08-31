(function(angular) {
  'use strict';

  angular.module('esn.header').run(runBlock);

  function runBlock(esnFeatureRegistry) {
    esnFeatureRegistry.add({
      name: 'Full screen mode',
      configurations: [{
        displayIn: 'Header',
        name: 'header:fullscreen'
      }],
      description: 'Display the full screen button'
    });
  }
})(angular);
