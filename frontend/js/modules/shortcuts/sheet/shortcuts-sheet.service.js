(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .service('esnShortcutsSheet', esnShortcutsSheet);

  function esnShortcutsSheet($modal) {
    var modal;

    return {
      toggle: toggle
    };

    function toggle() {
      if (!modal) {
        modal = $modal({
          templateUrl: '/views/modules/shortcuts/sheet/shortcuts-sheet.html',
          controller: 'EsnShortcutsSheetController',
          controllerAs: '$ctrl',
          placement: 'center'
        });
      } else {
        modal.toggle();
      }
    }
  }
})(angular);
