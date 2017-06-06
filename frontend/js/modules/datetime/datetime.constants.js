(function() {
  'use strict';

  angular.module('esn.datetime')
    .constant('ESN_DATETIME_DEFAULT_FORMAT', {
      date: 'dd/MM/yyyy',
      time: 'h:mm a',
      datetime: 'dd/MM/yyyy h:mm a'
    })
    .constant('ESN_DATETIME_DEFAULT_TIMEZONE', null); // Use timezone of the browser
})();
