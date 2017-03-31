(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calEventAlarmConsultationController', calEventAlarmConsultationController);

  function calEventAlarmConsultationController(CAL_ALARM_TRIGGER) {
    var self = this;

    self.trigger = self.event.alarm.trigger.toICALString();
    self.CAL_ALARM_TRIGGER = CAL_ALARM_TRIGGER;
  }

})();
