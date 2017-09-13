(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')

  .config(function(hotkeysProvider) {
    // disable built-in cheatsheet since we build it manually
    hotkeysProvider.includeCheatSheet = false;
    // disable route event because we do not use it
    hotkeysProvider.useNgRoute = false;
  });
})(angular);
