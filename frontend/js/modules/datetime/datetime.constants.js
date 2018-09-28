(function() {
  'use strict';

  angular.module('esn.datetime')
    .constant('ESN_DATETIME_DEFAULT_FORMAT', {
      time: 'h:mm a',
      datetime: 'mediumDate time'
    })
    .constant('ESN_DATETIME_AVAILABLE_DATETIME_FORMATS', [
        'shortDate',
        'mediumDate',
        'fullDate',
        'longDate',
        'time'
      ])
    .constant('ESN_DATETIME_TIME_FORMATS', {
      format12: 'h:mm a',
      format24: 'H:mm'
    })
    .constant('ESN_DATETIME_DEFAULT_TIMEZONE', null); // Use timezone of the browser
})();
