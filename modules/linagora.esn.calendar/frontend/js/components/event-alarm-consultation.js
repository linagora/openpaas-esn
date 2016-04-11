'use strict';

angular.module('esn.calendar')

  .directive('eventAlarmConsultation', function(TRIGGER) {
    function link(scope) {
      if (scope.event.alarm) {
        scope.trigger = scope.event.alarm.trigger.toICALString();
      }

      scope.TRIGGER = TRIGGER;
    }

    return {
      restrict: 'E',
      scope: {
        event: '='
      },
      replace: true,
      templateUrl: '/calendar/views/event-consult-form/event-alarm-consultation.html',
      link: link
    };
  });
