(function() {
  'use strict';

  angular.module('esn.datetime')
    .factory('esnDatetimeService', esnDatetimeService);

  function esnDatetimeService(
    $q,
    _,
    moment,
    esnConfig
  ) {
    var groups = [
      {name: 'Today', dateFormat: 'shortTime', accepts: _isToday},
      {name: 'Yesterday', dateFormat: 'EEE', accepts: _isYesterday},
      {name: 'This week', dateFormat: 'EEE', accepts: _isThisWeek},
      {name: 'Last week', dateFormat: 'MMM d', accepts: _isLastWeek},
      {name: 'This month', dateFormat: 'MMM d', accepts: _isThisMonth},
      {name: 'Last month', dateFormat: 'MMM d', accepts: _isLastMonth},
      {name: 'This year', dateFormat: 'MMM d', accepts: _isThisYear},
      {name: 'Old messages', dateFormat: 'shortDate', accepts: _.constant(true)}
    ];

    var timeZone;
    var locale;

    return {
      init: init,
      getGroup: getGroup,
      format: format,
      formatMediumDate: formatMediumDate,
      formatFullDate: formatFullDate,
      formatShortDate: formatShortDate,
      formatLongDate: formatLongDate,
      formatTime: formatTime,
      formatRelative: formatRelative
    };

    function init() {
      return $q.all([
        esnConfig('core.datetime').then(function(config) { timeZone = config.timeZone || 'UTC'; }),
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
          time: formatTime
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

    function getGroup(date) {
      return _.find(groups, function(group) { return group.accepts(moment(), moment(date)); });
    }

    function _getMoment(date) {
      var m;
      if (_.isDate(date)) {
        m = moment(date.toUTCString());
      } else if (_.isString(date) && !_.isNaN(Date.parse(date))) {
        m = moment(new Date(date).toUTCString());
      } else if (_.isNumber(date)) {
        var d = new Date();
        d.setTime(date);
        m = moment(d.toUTCString());
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
      return now.subtract(1, 'day').startOf('day').isBefore(targetMoment);
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
  }
})();
