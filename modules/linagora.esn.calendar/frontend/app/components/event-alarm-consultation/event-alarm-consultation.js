(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventAlarmConsultation', eventAlarmConsultation);

  function eventAlarmConsultation() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/event-alarm-consultation/event-alarm-consultation.html',
      scope: {
        event: '='
      },
      replace: true,
      controller: EventAlarmConsultationController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  EventAlarmConsultationController.$inject = ['TRIGGER'];

  function EventAlarmConsultationController(TRIGGER) {
    var self = this;

    self.trigger = self.event.alarm.trigger.toICALString();
    self.TRIGGER = TRIGGER;
  }

})();
