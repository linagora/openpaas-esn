'use strict';

angular.module('esn.calendar')

  .directive('calendarsList', function() {
    function link(scope) {
      scope.calendars = [{
        name: 'My calendar',
        color: 'orange',
        uuid: 1
      }, {
        name: 'Awesome Team',
        color: 'green',
        uuid: 2
      }
      , {
        name: 'Javascript',
        color: 'blue',
        uuid: 3
      }, {
        name: 'Material Design',
        color: 'indigo',
        uuid: 4
      }, {
        name: 'UX Team',
        color: 'pink',
        uuid: 5
      }, {
        name: 'Linagora',
        color: 'red',
        uuid: 6
      }];

      scope.newCalendar = {};
      scope.newCalendars = scope.calendars;
      scope.formToggled = false;
      scope.toggleForm = function() {
        scope.formToggled = !scope.formToggled;
      };

      scope.submit = function() {
        // return items that is in arrayA but not arrayB by property
        function _diff(arrayA, arrayB, property) {
          return arrayA.filter(function(itemA) {
            return !arrayB.some(function(itemB) { return itemA[property] === itemB[property] });
          })
        }
        var calendarsToAdd = _diff(scope.newCalendars, scope.calendars, 'uuid');
        var calendarsToRemove = _diff(scope.calendars, scope.newCalendars, 'uuid');
        // TODO Do something with calendarsToAdd and calendarsToRemove
        scope.calendars = scope.newCalendars;
        scope.toggleForm();
      }

      scope.remove = function(toremove) {
        scope.newCalendars = scope.newCalendars.filter(function(calendar) {
          return calendar.uuid !== toremove.uuid;
        });
      }

      scope.add = function() {
        if (!scope.newCalendar.name) {
          return;
        }
        scope.newCalendar.uuid = Math.floor(Math.random() * (10000 - 100 + 1)) + 100;
        scope.newCalendar.color = '#'+Math.random().toString(16).substr(-6);;
        scope.newCalendars.push(scope.newCalendar);
        scope.newCalendar = {};
      }
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
