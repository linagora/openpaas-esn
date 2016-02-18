'use strict';

angular.module('esn.calendar')

  /**
   * This directive takes an array of CalendarCollectionShell in entry and the calendarHomeId, then emit those events:
   *     calendars-list:toggleView - with the calendar {href: '', name: '', color: '', description: '', toggled: true||false} which should be toggled
   *
   */
  .directive('calendarsList', function(session, calendarService, CalendarCollectionShell, uuid4, CALENDAR_EVENTS) {
    function link(scope) {
      scope.onEditClick = scope.onEditClick || angular.noop;
      scope.hiddenCalendars = {};

      if (!scope.calendars && !angular.isArray(scope.calendars)) {
        session.ready.then(function() {
          calendarService.listCalendars(session.user._id).then(function(calendars) {
            scope.calendars = calendars;
          });
        });
      }

      scope.toggleCalendar = function(calendar)  {
        var hidden = scope.hiddenCalendars[calendar.id] = !scope.hiddenCalendars[calendar.id];
        scope.$emit(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {calendar: calendar, hidden: hidden});
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/calendars-list.html',
      scope: {
        calendars: '=?calendars',
        onEditClick: '=?'
      },
      link: link
    };
  });
