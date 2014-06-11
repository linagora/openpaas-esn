/*global easyrtc */

'use strict';

angular.module('esn.easyrtc', [])
  .factory('webrtcFactory', function() {
    function get() {
      return easyrtc;
    }

    return {
      get: get
    };
  }
);
