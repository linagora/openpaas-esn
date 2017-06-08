(function() {
  'use strict';

  angular.module('esn.datetime')
    .run(run);

    function run(esnDatetimeService) {
      esnDatetimeService.init();
    }
})();
