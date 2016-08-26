'use strict';

angular.module('esn.touchscreen-detector', [])
  .service('touchscreenDetectorService', function($window) {
    return {
      hasTouchscreen: hasTouchscreen
    };

    function hasTouchscreen() {
      return $window.navigator.maxTouchPoints > 0 || $window.navigator.msMaxTouchPoints > 0;
    }
  });
