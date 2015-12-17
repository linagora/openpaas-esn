'use strict';

angular.module('esn.calendar')

  /**
   * This directive takes an array of CalendarCollectionShell in entry and the calendarHomeId, then emit those events:
   *     calendars-list:added - with an array of CalendarCollectionShell
   *     calendars-list:removed - with an array of CalendarCollectionShell
   *     calendars-list:toggleView - with the calendar {href: '', name: '', color: '', description: '', toggled: true||false} which should be toggled
   *
   */
  .directive('calendarsList', function($location, session, calendarService, CalendarCollectionShell, uuid4, CALENDAR_EVENTS) {
    function link(scope) {

      function cloneCalendar(calendar) {
        return {
          href: calendar.getHref(),
          name: calendar.getName(),
          color: calendar.getColor(),
          description: calendar.getDescription(),
          id: calendar.getId(),
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

      scope.edit = function(calendar) {
        $location.url('/calendar/edit/' + calendar.id);
      };

      scope.add = function() {
        $location.url('/calendar/add');
      };

      scope.toggleCalendar = function(calendar)  {
        calendar.toggled = !calendar.toggled;
        scope.$emit(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, calendar);
      };

      scope.openConfigPanel = function()  {
        $location.url('/calendar/calendars-edit');
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/calendars-list.html',
      scope: {
        _calendars: '=?calendars'
      },
      link: link
    };
  });
