'use strict';

angular.module('esn.iframe-resizer-wrapper', [])

  .factory('iFrameResize', function($window) {
    return $window.iFrameResize;
  });
