(function() {
  'use strict';

  angular.module('esn.datetime')
    .factory('esnDatetimeService', esnDatetimeService);

  function esnDatetimeService($filter, ESN_DATETIME_DEFAULT_FORMAT, ESN_DATETIME_DEFAULT_TIMEZONE) {
    return {
      formatDate: formatDate
    };

    function formatDate(date, type) {
      var format = type ? ESN_DATETIME_DEFAULT_FORMAT[type] : ESN_DATETIME_DEFAULT_FORMAT.datetime;

      if (date instanceof Date || typeof date === 'number') {
        return _formatForInstanceOfDate(date, format);
      }

      if (Date.parse(date)) { // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        date = new Date(date);

        return _formatForInstanceOfDate(date, format);
      }

      return date;
    }

    function _formatForInstanceOfDate(date, format) {
      return $filter('date')(date, format, ESN_DATETIME_DEFAULT_TIMEZONE);
    }
  }
})();
