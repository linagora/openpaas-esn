'use strict';

angular.module('esn.lodash-wrapper', [])

  .factory('_', function($window) {
    return $window._;
  });
