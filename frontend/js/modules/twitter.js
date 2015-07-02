'use strict';

angular.module('esn.twitter', [])

  .factory('twitterWidgetService', function($window) {
      return $window.twttr;
  });
