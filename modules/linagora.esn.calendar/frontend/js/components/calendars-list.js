'use strict';

angular.module('esn.calendar')

  /**
   * This directive display the calendars of the user and emit those events:
   *     calendars-list:toggleView - with the calendar {href: '', name: '', color: '', description: '', toggled: true||false} which should be toggled
   *
   */
  .directive('calendarsList', function(session, calendarService, CALENDAR_EVENTS) {
    function link(scope) {
      scope.onEditClick = scope.onEditClick || angular.noop;
      scope.hiddenCalendars = {};

      calendarService.listCalendars(session.user._id).then(function(calendars) {
        scope.calendars = calendars;
      });

      scope.toggleCalendar = function(calendar) {
        var hidden = scope.hiddenCalendars[calendar.id] = !scope.hiddenCalendars[calendar.id];
        scope.$emit(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {calendar: calendar, hidden: hidden});
      };

      scope.selectCalendar = function(calendar) {
        scope.calendars.forEach(function(cal) {
          cal.selected = calendar.id === cal.id;
        });

        scope.hiddenCalendars[calendar.id] && scope.toggleCalendar(calendar);
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/components/calendars-list.html',
      scope: {
        onEditClick: '=?'
      },
      link: link
    };
  });
