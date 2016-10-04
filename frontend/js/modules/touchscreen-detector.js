'use strict';

angular.module('esn.touchscreen-detector', [])
  .service('touchscreenDetectorService', function($window) {
    return {
      hasTouchscreen: hasTouchscreen
    };

    function hasTouchscreen() {
      return 'ontouchstart' in $window || $window.navigator.maxTouchPoints > 0 || $window.navigator.msMaxTouchPoints > 0;
    }
  });
