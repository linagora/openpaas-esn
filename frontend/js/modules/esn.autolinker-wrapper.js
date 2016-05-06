'use strict';

angular.module('esn.autolinker-wrapper', [])

  .factory('autolinker', function($window) {
    return $window.Autolinker;
  });
