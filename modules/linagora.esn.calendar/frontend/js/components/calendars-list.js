'use strict';

angular.module('esn.calendar')
  /**
   * This directive display the calendars of the user and emit those events:
   *     calendars-list:toggleView - with the calendar {href: '', name: '', color: '', description: '', toggled: true||false} which should be toggled
   *
   */
  .directive('calendarsList', function(session, $rootScope, calendarService, calendarVisibilityService, CALENDAR_EVENTS) {
    function link(scope) {
      scope.onEditClick = scope.onEditClick || angular.noop;
      scope.hiddenCalendars = {};

      calendarVisibilityService.getHiddenCalendars().forEach(function(calendar) {
        scope.hiddenCalendars[calendar.id] = true;
      });

      calendarService.listCalendars(session.user._id).then(function(calendars) {
        scope.calendars = calendars;
      });

      scope.toggleCalendar = calendarVisibilityService.toggle;

      $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) {
        scope.hiddenCalendars[data.calendar.id] = data.hidden;
      });

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
