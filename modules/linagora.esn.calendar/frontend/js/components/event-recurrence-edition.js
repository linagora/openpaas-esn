'use strict';

angular.module('esn.calendar')
  .constant('RECUR_FREQ', [{
    // TODO i18n
    value: undefined,
    label: 'No repetition'
  }, {
    value: 'DAILY',
    label: 'Repeat daily'
  }, {
    value: 'WEEKLY',
    label: 'Repeat weekly'
  }, {
    value: 'MONTHLY',
    label: 'Repeat monthly'
  }, {
    value: 'YEARLY',
    label: 'Repeat yearly'
  }])
  .constant('WEEK_DAYS', {
    M: 'MO',
    T: 'TU',
    W: 'WE',
    Th: 'TH',
    F: 'FR',
    S: 'SA',
    Su: 'SU'
  })
  .directive('eventRecurrenceEdition', function(calendarUtils, RECUR_FREQ, WEEK_DAYS) {
    function link(scope, element) {
      scope._event.getModifiedMaster().then(function(master) {
        scope.readOnly = !scope.isOrganizer || scope._event.isInstance();
        scope.event = master;

        if (!scope.event.rrule) {
          scope.event.rrule = {
            freq: RECUR_FREQ[0].value,
            interval: null
          };
        }
      });

      scope.RECUR_FREQ = RECUR_FREQ;
      scope.WEEK_DAYS = Object.keys(WEEK_DAYS);
      scope.animateFlexContainer = false;
      var weekDaysValues = Object.keys(WEEK_DAYS).map(function(key) {
        return WEEK_DAYS[key];
      });
      scope.toggleWeekdays = function(weekday) {
        var index = scope.event.rrule.byday.indexOf(WEEK_DAYS[weekday]);
        var newDays = scope.event.rrule.byday.slice();
        if (index > -1) {
          newDays.splice(index, 1);
        } else {
          newDays.push(WEEK_DAYS[weekday]);
        }
        newDays.sort(function(weekdayA, weekdayB) {
          if (weekDaysValues.indexOf(weekdayA) > weekDaysValues.indexOf(weekdayB)) {
            return 1;
          } else if (weekDaysValues.indexOf(weekdayA) < weekDaysValues.indexOf(weekdayB)) {
            return -1;
          } else {
            return 0;
          }
        });
        scope.event.rrule.byday = newDays;
      };

      scope.selectEndRadioButton = function(index) {
        var radioButtons = element.find('input[name="inlineRadioEndOptions"]');
        radioButtons[index].checked = true;
        // reset event.rrule.until if we are clicking on After ... occurrences input.
        if (index === 1) {
          scope.resetUntil();
        }
        // reset event.rrule.until if we are clicking on At ... input.
        if (index === 2) {
          scope.resetCount();
        }
      };

      scope.resetUntil = function() {
        scope.event.rrule.until = undefined;
      };

      scope.resetCount = function() {
        scope.event.rrule.count = undefined;
      };
    }

    return {
      restrict: 'E',
      scope: {
        _event: '=event',
        isOrganizer: '=?'
      },
      replace: true,
      templateUrl: '/calendar/views/components/event-recurrence-edition.html',
      link: link
    };
  });
