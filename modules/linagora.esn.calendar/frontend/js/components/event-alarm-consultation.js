(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventAlarmConsultation', eventAlarmConsultation);

  function eventAlarmConsultation() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/views/components/event-alarm-consultation.html',
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
    var vm = this;

    vm.trigger = vm.event.alarm.trigger.toICALString();
    vm.TRIGGER = TRIGGER;
  }

})();
