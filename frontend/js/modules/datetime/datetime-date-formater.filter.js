(function() {
  'use strict';

  angular.module('esn.datetime')
    .filter('esnDatetime', esnDatetime);

  function esnDatetime(esnDatetimeService) {
    return function(date, formats) {
      return esnDatetimeService.format(date, formats);
    };
  }
})();
