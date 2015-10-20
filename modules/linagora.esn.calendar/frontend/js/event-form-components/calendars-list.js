'use strict';

angular.module('esn.calendar')

  /**
   * This directive takes an array of CalendarCollectionShell in entry and the calendarHomeId, then emit those events:
   *     calendars-list:added - with an array of CalendarCollectionShell
   *     calendars-list:removed - with an array of CalendarCollectionShell
   *     calendars-list:toggleView - with  the calendar which should be toggled
   *
   */
  .directive('calendarsList', function(calendarService, CalendarCollectionShell, uuid4) {
    function link(scope) {
      scope.calendars = scope.calendars || [];
      scope.oldCalendars = scope.calendars.map(function(calendar) {
        return {
          href: calendar.getHref(),
          name: calendar.getName(),
          color: calendar.getColor(),
          description: calendar.getDescription(),
          toggled: true
        };
      });
      scope.newCalendars = angular.copy(scope.oldCalendars);
      scope.newCalendar = {};
      scope.formToggled = false;

      scope.toggleForm = function() {
        scope.formToggled = !scope.formToggled;
      };

      scope.submit = function() {
        // return items that is in arrayA but not arrayB by property
        function _diff(arrayA, arrayB, property) {
          return arrayA.filter(function(itemA) {
            return !arrayB.some(function(itemB) { return itemA[property] === itemB[property]; });
          });
        }
        var calendarsToAdd = _diff(scope.newCalendars, scope.oldCalendars, 'href');
        var calendarsToRemove = _diff(scope.oldCalendars, scope.newCalendars, 'href');
        if (calendarsToAdd.length) {
          scope.$emit('calendars-list:added', calendarsToAdd.map(CalendarCollectionShell.from));
        }
        if (calendarsToAdd.length) {
          scope.$emit('calendars-list:removed', calendarsToRemove.map(CalendarCollectionShell.from));
        }
        scope.toggleForm();
      };

      scope.remove = function(toremove) {
        scope.newCalendars = scope.newCalendars.filter(function(calendar) {
          return calendar.href !== toremove.href;
        });
      };

      scope.add = function() {
        if (!scope.newCalendar.name) {
          return;
        }
        scope.newCalendar.href = CalendarCollectionShell.buildHref(calendarService.calendarHomeId, uuid4.generate());
        scope.newCalendar.color = '#' + Math.random().toString(16).substr(-6);
        scope.newCalendar.toggled = true;
        scope.newCalendars.push(scope.newCalendar);
        scope.newCalendar = {};
      };

      scope.toggleCalendar = function(calendar)  {
        calendar.toggled = !calendar.toggled;
        scope.$emit('calendars-list:toggleView', calendar);
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-form-components/calendars-list.html',
      scope: {
        calendars: '='
      },
      link: link
    };
  });
