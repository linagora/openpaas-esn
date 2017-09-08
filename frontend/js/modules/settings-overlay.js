(function() {
  'use strict';

  angular.module('esn.settings-overlay', [])
    .component('settingsOverlay', {
      templateUrl: '/views/modules/settings-overlay/template.html',
      transclude: true,
      controller: function() {
        var self = this;

        self.openMenu = function($mdMenu, event) {
          $mdMenu.open(event);
        };
      },
      controllerAs: 'ctrl'
    });
})();
