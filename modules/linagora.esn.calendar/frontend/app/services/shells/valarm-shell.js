(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('CalVAlarmShell', CalVAlarmShellFactory);

  CalVAlarmShellFactory.$inject = [
    'ALARM_MODIFY_COMPARE_KEYS'
  ];

  function CalVAlarmShellFactory(ALARM_MODIFY_COMPARE_KEYS) {
    function CalVAlarmShell(valarm, vevent) {
      this.valarm = valarm;
      this.vevent = vevent;
    }

    CalVAlarmShell.prototype = {
      get action() { return this.valarm.getFirstPropertyValue('action'); },
      get trigger() { return this.valarm.getFirstPropertyValue('trigger'); },
      get description() { return this.valarm.getFirstPropertyValue('description'); },
      get summary() { return this.valarm.getFirstPropertyValue('summary'); },
      get attendee() { return this.valarm.getFirstPropertyValue('attendee'); },
      equals: equals
    };

    return CalVAlarmShell;

    ////////////

    function equals(that) {
      if (that === this) { return true; }
      var self = this;

      return ALARM_MODIFY_COMPARE_KEYS.every(function(key) {
        if (key === 'trigger') {
          return self.trigger.compare(that.trigger) === 0;
        } else {
          return angular.equals(self[key], that[key]);
        }
      });
    }
  }
})();
