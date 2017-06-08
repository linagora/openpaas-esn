(function() {
  'use strict';

  angular.module('esn.datetime')
    .factory('esnDatetimeService', esnDatetimeService);

  function esnDatetimeService(
    $filter,
    esnConfig,
    ESN_DATETIME_DEFAULT_FORMAT,
    ESN_DATETIME_DEFAULT_TIMEZONE
  ) {
    var datetimeFormat = ESN_DATETIME_DEFAULT_FORMAT;

    return {
      formatDate: formatDate,
      init: init
    };

    function init() {
      esnConfig('core.datetime').then(function(datetime) {
        if (datetime) {
          _setDatetimeFormat({
            date: datetime.dateFormat,
            time: datetime.timeFormat
          });
        }
      });
    }

    function formatDate(date, type) {
      var format = _getFormatByType(type);

      if (date instanceof Date || typeof date === 'number') {
        return _formatForInstanceOfDate(date, format);
      }

      if (Date.parse(date)) { // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        date = new Date(date);

        return _formatForInstanceOfDate(date, format);
      }

      return date;
    }

    function _setDatetimeFormat(format) {
      datetimeFormat = angular.extend({}, datetimeFormat, format);

      datetimeFormat.datetime = datetimeFormat.date + ' ' + datetimeFormat.time;
    }

    function _getFormatByType(type) {
      return datetimeFormat[type] || datetimeFormat.datetime;
    }

    function _formatForInstanceOfDate(date, format) {
      return $filter('date')(date, format, ESN_DATETIME_DEFAULT_TIMEZONE);
    }
  }
})();
