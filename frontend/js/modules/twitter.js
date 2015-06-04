'use strict';

angular.module('esn.twitter', [])

  .factory('twitterWidgetService', ['$window', function($window) {
      return $window.twttr;
  }]);
