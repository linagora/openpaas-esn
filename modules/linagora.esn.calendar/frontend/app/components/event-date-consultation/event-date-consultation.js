(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventDateConsultation', eventDateConsultation);

  function eventDateConsultation() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/event-date-consultation/event-date-consultation.html',
      scope: {
        event: '='
      },
      replace: true,
      controller: EventDateConsultationController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  EventDateConsultationController.$inject = [];

  function EventDateConsultationController() {
    var vm = this;

    vm.start = undefined;
    vm.end = undefined;

    activate();

    ////////////

    function activate() {
      if (!vm.event.allDay) {
        vm.start = vm.event.start.format('MMMM D hh:mma');
        if (vm.event.start.isSame(vm.event.end, 'day')) {
          vm.end = vm.event.end.format('hh:mma');
        } else {
          vm.end = vm.event.end.format('MMMM D hh:mma');
        }
      } else {
        vm.start = vm.event.start.format('MMMM D');
        vm.end = vm.event.end.clone().subtract(1, 'day').format('MMMM D');
      }
    }
  }

})();
