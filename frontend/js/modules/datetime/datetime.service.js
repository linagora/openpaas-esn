(function() {
  'use strict';

  angular.module('esn.datetime')
    .factory('esnDatetimeService', esnDatetimeService);

  function esnDatetimeService(
    $filter,
    esnConfig,
    ESN_DATETIME_DEFAULT_FORMAT,
    ESN_DATETIME_DEFAULT_TIMEZONE,
    ESN_DATETIME_TIME_FORMATS,
    ESN_DATETIME_AVAILABLE_DATETIME_FORMATS
  ) {
    var timeFormat = ESN_DATETIME_DEFAULT_FORMAT.time;

    return {
      init: init,
      format: format,
      formatMediumDate: formatMediumDate,
      formatFullDate: formatFullDate,
      formatShortDate: formatShortDate,
      formatLongDate: formatLongDate,
      formatTime: formatTime
    };

    function init() {
      esnConfig('core.datetime').then(function(datetime) {
        if (datetime) {
          timeFormat = datetime.use24hourFormat ? ESN_DATETIME_TIME_FORMATS.format24 : ESN_DATETIME_TIME_FORMATS.format12;
        }
      });
    }

    function format(date, format) {
      if (date instanceof Date || typeof date === 'number') {
        return _getFormattedDatetime(date, format);
      }

      if (Date.parse(date)) { // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        date = new Date(date);

        return _getFormattedDatetime(date, format);
      }

      return date;
    }

    function formatMediumDate(date) {
      return format(date, 'mediumDate');
    }

    function formatFullDate(date) {
      return format(date, 'fullDate');
    }

    function formatShortDate(date) {
      return format(date, 'shortDate');
    }

    function formatLongDate(date) {
      return format(date, 'longDate');
    }

    function formatTime(date) {
      return format(date, 'time');
    }

    function _getFormattedDatetime(date, format) {
      return ESN_DATETIME_AVAILABLE_DATETIME_FORMATS.reduce(function(datetimeString, formatString) {
        var formatRegexp = new RegExp(formatString, 'g');

        return datetimeString.replace(formatRegexp, function() {
            return $filter('date')(date, formatString === 'time' ? timeFormat : formatString, ESN_DATETIME_DEFAULT_TIMEZONE);
        });
      }, format);
    }
  }
})();
