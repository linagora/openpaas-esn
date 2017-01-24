(function() {
  'use strict';

  angular.module('esn.collaboration').run(run);

  function run(esnCollaborationListener) {
    esnCollaborationListener.init();
  }
})();
