(function() {
  'use strict';

  // Keeping these as there are still used in inbox and calendar
  angular.module('esn.datetime')
    .constant('ESN_DATETIME_TIME_FORMATS', {
      format12: 'h:mm A',
      format24: 'H:mm'
    })
    .constant('ESN_DATETIME_DEFAULT_TIMEZONE', null); // Use timezone of the browser
})();
