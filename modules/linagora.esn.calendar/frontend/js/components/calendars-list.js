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

      function cloneCalendar(calendar) {
        return {
          href: calendar.href,
          name: calendar.name,
          color: calendar.color,
          description: calendar.description,
          id: calendar.id,
          toggled: true
        };
      }

      if (!scope._calendars && !angular.isArray(scope._calendars)) {
        session.ready.then(function() {
          calendarService.listCalendars(session.user._id).then(function(calendars) {
            scope.calendars = calendars.map(cloneCalendar);
          });
        });
      } else {
        scope.calendars = scope._calendars.map(cloneCalendar);
      }

      scope.toggleCalendar = function(calendar)  {
        calendar.toggled = !calendar.toggled;
        scope.$emit(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, calendar);
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/calendars-list.html',
      scope: {
        _calendars: '=?calendars',
        onEditClick: '=?'
      },
      link: link
    };
  });
