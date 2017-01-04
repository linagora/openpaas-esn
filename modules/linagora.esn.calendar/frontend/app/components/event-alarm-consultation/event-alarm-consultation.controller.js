(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calEventAlarmConsultationController', calEventAlarmConsultationController);

  function calEventAlarmConsultationController(TRIGGER) {
    var self = this;

    self.trigger = self.event.alarm.trigger.toICALString();
    self.TRIGGER = TRIGGER;
  }

})();
