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
    'M': 'MO',
    'T': 'TU',
    'W': 'WE',
    'Th': 'TH',
    'F': 'FR',
    'S': 'SA',
    'Su': 'SU'
  })
  .directive('eventRecurrenceEdition', function(moment, calendarUtils, RECUR_FREQ, WEEK_DAYS) {
    function link(scope, element) {
      scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
      if (!scope.event.recur) {
        scope.event.recur = {
          freq: RECUR_FREQ[0].value,
          until: undefined,
          byday: [],
          interval: 1,
          count: undefined
        };
      }
      scope.RECUR_FREQ = RECUR_FREQ;
      scope.WEEK_DAYS = Object.keys(WEEK_DAYS);
      scope.animateFlexContainer = false;
      var weekDaysValues = Object.keys(WEEK_DAYS).map(function(key) {
          return WEEK_DAYS[key];
      });

      scope.toggleWeekdays = function(weekday) {
        var index = scope.event.recur.byday.indexOf(WEEK_DAYS[weekday]);
        if (index > -1) {
          scope.event.recur.byday.splice(index, 1);
        } else {
          scope.event.recur.byday.push(WEEK_DAYS[weekday]);
        }
        scope.event.recur.byday.sort(function(weekdayA, weekdayB) {
          if (weekDaysValues.indexOf(weekdayA) > weekDaysValues.indexOf(weekdayB)) {
            return 1;
          } else if (weekDaysValues.indexOf(weekdayA) < weekDaysValues.indexOf(weekdayB)) {
            return -1;
          } else {
            return 0;
          }
        });
      };

      scope.selectEndRadioButton = function(index) {
        var radioButtons = element.find('input[name="inlineRadioEndOptions"]');
        radioButtons[index].checked = true;
        // reset event.recur.until if we are clicking on After ... occurrences input.
        if (index === 1) {
          scope.resetUntil();
        }
        // reset event.recur.until if we are clicking on At ... input.
        if (index === 2) {
          scope.resetCount();
        }
      };

      scope.resetUntil = function() {
        scope.event.recur.until = undefined;
      };

      scope.resetCount = function() {
        scope.event.recur.count = undefined;
      };
    }

    return {
      restrict: 'E',
      scope: {
        event: '=',
        readOnly: '=?'
      },
      replace: true,
      templateUrl: '/calendar/views/event-form-components/event-recurrence-edition.html',
      link: link
    };
  });
