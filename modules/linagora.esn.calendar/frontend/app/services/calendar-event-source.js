(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarEventSource', calendarEventSource);

  function calendarEventSource($log, calEventService) {
    return function(calendar, errorCallback) {
      return function(start, end, timezone, callback) {
        $log.debug('Getting events for %s', calendar.uniqueId);

        // Timezone Fix, cannot get proper moment at midnight in local timezone due to FullCalendar specific moments.
        // Start and end dates are parsed in calendarCurrentView.restoreCurrentViewFromUrl.
        // They have no timezone and no time for FullCalendar (see Ambiguous-Zoned and Ambiguous-Timed Moments in FullCalendar)
        // They are actually moments at 0:00 AM in UTC+0 and event range is not correct according to time zone.
        // So we've added 1 day margin to fix that
        return calEventService.listEvents(calendar.isSubscription() ? calendar.source.href : calendar.href, start.clone().subtract(1, 'day'), end.clone().add(1, 'day'), timezone).then(
          function(events) {
            callback(events.filter(function(event) {
              return !event.status || event.status !== 'CANCELLED';
            }));
          }, function(err) {
            callback([]);
            $log.error(err);
            if (errorCallback) {
              errorCallback(err, 'Can not get calendar events');
            }
          });
      };
    };
  }

})();
