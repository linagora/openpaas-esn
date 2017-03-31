(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calEventAlarmEditionController', calEventAlarmEditionController);

  function calEventAlarmEditionController(session, CAL_ALARM_TRIGGER) {
    var self = this;

    self.trigger = undefined;
    self.CAL_ALARM_TRIGGER = CAL_ALARM_TRIGGER;
    self.setEventAlarm = setEventAlarm;

    activate();

    ////////////

    function activate() {
      if (self.event.alarm) {
        self.trigger = self.event.alarm.trigger.toICALString();
      }
    }

    function setEventAlarm() {
      if (!self.trigger) {
        self.event.alarm = undefined;
      } else {
        self.event.alarm = {
          trigger: self.trigger,
          attendee: session.user.emails[0]
        };
      }
    }
  }

})();
