(function() {
  'use strict';

  angular.module('esn.datetime')
    .filter('esnDatetime', esnDatetime);

  function esnDatetime(esnDatetimeService) {
    return function(date, type) {
      return esnDatetimeService.formatDate(date, type);
    };
  }
})();
