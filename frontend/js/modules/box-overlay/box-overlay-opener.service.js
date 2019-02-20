(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').service('boxOverlayOpener', boxOverlayOpener);

  function boxOverlayOpener($boxOverlay) {
    return {
      open: open
    };

    function open(options) {
      var overlay = $boxOverlay(options);

      if (angular.isDefined(overlay)) {
        overlay.show();
      }

      return overlay;
    }
  }
})(angular);
