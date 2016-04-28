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
      templateUrl: '/calendar/views/components/event-alarm-consultation.html',
      link: link
    };
  });
