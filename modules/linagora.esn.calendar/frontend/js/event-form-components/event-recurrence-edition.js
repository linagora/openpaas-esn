'use strict';

angular.module('esn.calendar')
  .constant('RRUL_FREQ', [{
    // TODO i18n
    value: 'None',
    label: 'No repetition'
  }, {
    value: 'Daily',
    label: 'Repeat daily'
  }, {
    value: 'Monthly',
    label: 'Repeat monthly'
  }, {
    value: 'Yearly',
    label: 'Repeat yearly'
  }])
  .directive('eventRecurrenceEdition', function(moment, calendarUtils, RRUL_FREQ) {
    function link(scope) {
      scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
      scope.event.rrule = {
        freq: RRUL_FREQ[0].value
      };
      scope.rruleFreq = RRUL_FREQ;
      scope.animateSwitchContainer = false;
      scope.updateSwitchClass = function() {
        scope.animateSwitchContainer = scope.event.rrule.freq !== RRUL_FREQ[0].value;
      };
    }

    return {
      restrict: 'E',
      scope: {
        event: '=',
        disabled: '=?'
      },
      replace: true,
      templateUrl: '/calendar/views/event-form-components/event-recurrence-edition.html',
      link: link
    };
  });
