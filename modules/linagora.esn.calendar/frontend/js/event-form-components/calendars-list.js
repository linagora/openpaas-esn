'use strict';

angular.module('esn.calendar')

  .directive('calendarsList', function(CalendarCollectionShell, uuid4) {
    function link(scope) {
      scope.oldCalendars = scope.calendars.map(function(calendar) {
        return {
          id: calendar.getId(),
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
        var calendarsToAdd = _diff(scope.newCalendars, scope.oldCalendars, 'id');
        var calendarsToRemove = _diff(scope.oldCalendars, scope.newCalendars, 'id');
        if (calendarsToAdd.length) {
          scope.$emit('calendars-list:added', calendarsToAdd);
        }
        if (calendarsToAdd.length) {
          scope.$emit('calendars-list:removed', calendarsToRemove);
        }
        scope.toggleForm();
      };

      scope.remove = function(toremove) {
        scope.newCalendars = scope.newCalendars.filter(function(calendar) {
          return calendar.id !== toremove.id;
        });
      };

      scope.add = function() {
        if (!scope.newCalendar.name) {
          return;
        }
        scope.newCalendar.id = uuid4.generate();
        scope.newCalendar.color = '#' + Math.random().toString(16).substr(-6);
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
