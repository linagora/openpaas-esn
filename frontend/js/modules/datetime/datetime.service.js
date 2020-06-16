(function() {
  'use strict';

  angular.module('esn.datetime')
    .factory('esnDatetimeService', esnDatetimeService);

  function esnDatetimeService(
    $q,
    _,
    moment,
    esnConfig,
    ESN_DATETIME_TIME_FORMATS
  ) {
    var humanTimeGroupings = [
      {name: 'Today', dateFormat: 'shortTime', accepts: _isToday},
      {name: 'Yesterday', dateFormat: 'ddd', accepts: _isYesterday},
      {name: 'This week', dateFormat: 'ddd', accepts: _isThisWeek},
      {name: 'Last week', dateFormat: 'MMM D', accepts: _isLastWeek},
      {name: 'This month', dateFormat: 'MMM D', accepts: _isThisMonth},
      {name: 'Last month', dateFormat: 'MMM D', accepts: _isLastMonth},
      {name: 'This year', dateFormat: 'MMM D', accepts: _isThisYear},
      {name: 'Old messages', dateFormat: 'shortDate', accepts: _.constant(true)}
    ];

    var timeZone;
    var timeFormat;
    var use24hourFormat;
    var locale;

    return {
      init: init,
      getHumanTimeGrouping: getHumanTimeGrouping,
      is24hourFormat: is24hourFormat,
      getTimeFormat: getTimeFormat,
      getTimeZone: getTimeZone,
      format: format,
      formatMediumDate: formatMediumDate,
      formatFullDate: formatFullDate,
      formatShortDate: formatShortDate,
      formatLongDate: formatLongDate,
      formatTime: formatTime,
      formatRelative: formatRelative,
      updateObjectToUserTimeZone: updateObjectToUserTimeZone,
      updateObjectToBrowserTimeZone: updateObjectToBrowserTimeZone,
      setAmbigTime: setAmbigTime
    };

    function init() {
      return $q.all([
        esnConfig('core.datetime').then(function(config) {
          timeZone = config && config.timeZone || 'UTC';
          use24hourFormat = config && config.use24hourFormat;
          timeFormat = use24hourFormat ? ESN_DATETIME_TIME_FORMATS.format24 : ESN_DATETIME_TIME_FORMATS.format12;
        }),
        esnConfig('core.language').then(function(config) { locale = config || 'en'; })
      ]);
    }

    function format(date, formats) {
      return _.map(formats.trim().split(/\s+/), function(format) {
        var formatFunction = {
          fullDate: formatFullDate,
          shortDate: formatShortDate,
          mediumDate: formatMediumDate,
          longDate: formatLongDate,
          time: formatTime,
          shortTime: formatTime
        }[format];
        return formatFunction ? formatFunction(date) : _getMoment(date).format(format);
      }).join(' ');
    }

    function formatMediumDate(date) {
      return _getMoment(date).format('LL');  // June 9 2014
    }

    function formatFullDate(date) {
      return _getMoment(date).format('LLLL');  // Monday, June 9 2014 9:32 PM
    }

    function formatShortDate(date) {
      return _getMoment(date).format('L');  // 06/09/2014
    }

    function formatLongDate(date) {
      return _getMoment(date).format('LLL');  // June 9 2014 9:32 PM
    }

    function formatTime(date) {
      return _getMoment(date).format('LT');  // 8:30 PM
    }

    function formatRelative(date) {
      return _getMoment(date).fromNow();
    }

    function getHumanTimeGrouping(date) {
      return _.find(humanTimeGroupings, function(group) { return group.accepts(moment(), moment(date)); });
    }

    function is24hourFormat() {
      return use24hourFormat;
    }

    function getTimeFormat() {
      return timeFormat;
    }

    function getTimeZone() {
      return timeZone;
    }

    function _getMoment(date) {
      var m;
      if (_.isDate(date)) {
        m = moment(date.toISOString());
      } else if (_.isString(date) && !_.isNaN(Date.parse(date))) {
        m = moment(new Date(date).toISOString());
      } else if (_.isNumber(date)) {
        var d = new Date();
        d.setTime(date);
        m = moment(d.toISOString());
      }

      try {
        return m.locale(locale).tz(timeZone);
      } catch (_) {
        return {format: function() { return date; }};
      }
    }

    function _isToday(now, targetMoment) {
      return now.startOf('day').isBefore(targetMoment);
    }

    function _isYesterday(now, targetMoment) {
      return now.startOf('day').subtract(1, 'day').isBefore(targetMoment);
    }

    function _isThisWeek(now, targetMoment) {
      return now.startOf('week').isBefore(targetMoment);
    }

    function _isLastWeek(now, targetMoment) {
      return now.startOf('week').subtract(1, 'week').isBefore(targetMoment);
    }

    function _isThisMonth(now, targetMoment) {
      return now.startOf('month').isBefore(targetMoment);
    }

    function _isLastMonth(now, targetMoment) {
      return now.startOf('month').subtract(1, 'month').isBefore(targetMoment);
    }

    function _isThisYear(now, targetMoment) {
      return now.startOf('year').isBefore(targetMoment);
    }

    /**
     * Create a new instance of moment object with same time & date as the source object, but different time zone. The output
     * time zone is retrieved from user configuration.
     * @param {MomentObject} date: Source moment object
     * @param {object} options: Options for outputted moment object
     */
    function updateObjectToUserTimeZone(date, options) {
      options = options || {};
      var converted;

      if (date && date.format && date.format('YYYY-MM-DD HH:mm')) {
        converted = moment.tz(date.format('YYYY-MM-DD HH:mm'), getTimeZone());
        _.assign(converted, options);
      }

      return converted;
    }

    /**
     * Create a new instance of moment object with same time & date as the source object, but different time zone. The output
     * time zone is the browser time zone.
     * @param {MomentObject} date: Source moment object
     * @param {object} options: Options for outputted moment object
     */
    function updateObjectToBrowserTimeZone(date, options) {
      options = options || {};
      var converted;

      if (date && date.format && date.format('YYYY-MM-DD HH:mm')) {
        var browserTimeZone = moment.tz.guess(true);

        converted = moment.tz(date.format('YYYY-MM-DD HH:mm'), browserTimeZone);
        _.assign(converted, options);
      }

      return converted;
    }

    /**
     * Override the _ambigTime property of moment object. If ambigTime is false, m.hasTime() will return true and vice versa
     * @param {MomentObject} src: Source moment object
     * @param {Boolean} ambigTime
     */
    function setAmbigTime(src, ambigTime) {
      src._ambigTime = !!ambigTime;

      return src;
    }
  }
})();
