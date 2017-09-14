(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')

    .run(function(deviceDetector, hotkeys, esnShortcutsGlobal) {
      if (deviceDetector.isMobile()) {
        hotkeys.pause();
      } else {
        esnShortcutsGlobal.load();
      }
    });
})(angular);
