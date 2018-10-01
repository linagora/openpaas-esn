(function() {
  'use strict';

  angular.module('esn.datetime')
    .constant('ESN_DATETIME_DEFAULT_FORMAT', {
      time: 'h:mm A',
      datetime: 'mediumDate time'
    })
    .constant('ESN_DATETIME_AVAILABLE_DATETIME_FORMATS', [
      'shortDate',
      'mediumDate',
      'fullDate',
      'longDate',
      'time'
    ])
    .constant('ESN_DATETIME_DATE_FORMATS', {
      en: {
        shortDate: 'M/D/YYYY',
        mediumDate: 'MMM D, Y',
        longDate: 'MMMM D, Y',
        fullDate: 'dddd, MMMM Do YYYY'
      },
      fr: {
        shortDate: 'D/M/YYYY',
        mediumDate: 'D MMM Y',
        longDate: 'D MMMM Y',
        fullDate: 'dddd, Do MMMM YYYY'
      },
      vi: {
        shortDate: 'D/M/YYYY',
        mediumDate: 'D MMM, Y',
        longDate: 'D MMMM, Y',
        fullDate: 'dddd, Do MMMM, YYYY'
      }
    })
    .constant('ESN_DATETIME_TIME_FORMATS', {
      format12: 'h:mm A',
      format24: 'H:mm'
    })
    .constant('ESN_DATETIME_DEFAULT_TIMEZONE', null); // Use timezone of the browser
})();
