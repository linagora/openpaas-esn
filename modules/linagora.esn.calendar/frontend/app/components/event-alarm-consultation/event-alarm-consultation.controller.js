(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('eventAlarmConsultationController', eventAlarmConsultationController);

  function eventAlarmConsultationController(TRIGGER) {
    var self = this;

    self.trigger = self.event.alarm.trigger.toICALString();
    self.TRIGGER = TRIGGER;
  }

})();
