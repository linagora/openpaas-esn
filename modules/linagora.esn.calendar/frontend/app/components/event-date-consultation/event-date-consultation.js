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
    var self = this;

    self.start = undefined;
    self.end = undefined;

    activate();

    ////////////

    function activate() {
      if (!self.event.allDay) {
        self.start = self.event.start.format('MMMM D hh:mma');
        if (self.event.start.isSame(self.event.end, 'day')) {
          self.end = self.event.end.format('hh:mma');
        } else {
          self.end = self.event.end.format('MMMM D hh:mma');
        }
      } else {
        self.start = self.event.start.format('MMMM D');
        self.end = self.event.end.clone().subtract(1, 'day').format('MMMM D');
      }
    }
  }

})();
