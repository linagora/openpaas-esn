(function() {
  'use strict';

  angular.module('esn.attachment', [
    'esn.file',
    'esn.core',
    'esn.registry',
    'esn.file-saver',
    'ngSanitize',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.buffering',
    'com.2fdevs.videogular.plugins.controls',
    'com.2fdevs.videogular.plugins.overlayplay'
  ]);
})();
