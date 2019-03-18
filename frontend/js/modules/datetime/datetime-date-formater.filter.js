(function() {
  'use strict';

  angular.module('esn.datetime')
    .filter('esnDatetime', esnDatetime);

  function esnDatetime(esnDatetimeService) {
    return function(date, format) {
      if (format === 'HumanTimeGrouping') {
        format = esnDatetimeService.getHumanTimeGrouping(date).dateFormat;
      }

      return esnDatetimeService.format(date, format);
    };
  }
})();
