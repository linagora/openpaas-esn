'use strict';

/**
 * It is worth knowing that fullcalendar leverages MomentJS for most date-related operations.
 * Indeed, it wraps every moment object into a fc-moment one.
 * Using the terminology of fullcalendar, an allday event is represented as an ambiguously-timed
 * moment object. That is, it is represented as a moment object that has no time.
 * However, an ambiguously-timed moment has a time zone which is set by default to UTC.
 * Even if we set the fullcalendar's timezone option to local, allday events are always
 * returned as UTC. See {https://github.com/fullcalendar/fullcalendar/issues/2477}
 */
angular.module('esn.fcmoment', [])
  .factory('fcMoment', function($window, ICAL) {
    var fcMoment = function(time) {
      if (time && (time instanceof ICAL.Time)) {
        if (!time.zone) {
          time.zone = ICAL.Timezone.localTimezone;
        }
        var m = $window.$.fullCalendar.moment(time.toJSDate());

        if (time.zone !== ICAL.Timezone.localTimezone) {
          m.utcOffset(time.utcOffset());
        }
        if (time.isDate) {
          m.stripTime();
        }
        return m;
      }
      return $window.$.fullCalendar.moment.apply(this, arguments);
    };

    angular.extend(fcMoment, $window.moment);

    return fcMoment;
  });
