(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')

    .run(function(esnShortcutsGlobal) {
      esnShortcutsGlobal.load();
    });
})(angular);
