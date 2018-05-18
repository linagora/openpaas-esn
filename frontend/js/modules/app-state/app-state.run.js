(function(angular) {
  'use strict';

  angular.module('esn.app-state')
    .run(run);

  function run(esnAppStateService) {
    esnAppStateService.listenStateEvents();
  }
})(angular);
