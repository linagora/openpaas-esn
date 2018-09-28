(function() {
  'use strict';

  angular.module('esn.datetime')
    .factory('esnDatetimeService', esnDatetimeService);

  function esnDatetimeService(
    $q,
    _,
    moment,
    esnConfig,
    ESN_DATETIME_DEFAULT_FORMAT,
    ESN_DATETIME_DEFAULT_TIMEZONE,
    ESN_DATETIME_TIME_FORMATS,
    ESN_DATETIME_AVAILABLE_DATETIME_FORMATS,
    ESN_DATETIME_DATE_FORMATS
  ) {
    var timeFormat = ESN_DATETIME_DEFAULT_FORMAT.time;
    var timeZone = ESN_DATETIME_DEFAULT_TIMEZONE;
    var dateFormats = ESN_DATETIME_DATE_FORMATS.en;

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
      $q.all([
        esnConfig('core.datetime'),
        esnConfig('core.language')
      ]).then(function(configs) {
        timeFormat = configs[0].use24hourFormat ? ESN_DATETIME_TIME_FORMATS.format24 : ESN_DATETIME_TIME_FORMATS.format12;
        timeZone = configs[0].timeZone;
        moment.locale(configs[1]);

        if (ESN_DATETIME_DATE_FORMATS[configs[1]]) {
          dateFormats = ESN_DATETIME_DATE_FORMATS[configs[1]];
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
      date = date instanceof Date ? date : new Date(date);
      var convertedDateByTimeZone = moment.tz(date, timeZone);

      return ESN_DATETIME_AVAILABLE_DATETIME_FORMATS.reduce(function(datetimeString, formatString) {
        var formatRegexp = new RegExp(formatString, 'g');

        return datetimeString.replace(formatRegexp, function() {
          return convertedDateByTimeZone.format(formatString === 'time' ? timeFormat : dateFormats[formatString]);
        });
      }, format);
    }
  }
})();
