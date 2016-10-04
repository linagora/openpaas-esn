(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('VAlarmShell', VAlarmShellFactory);

  VAlarmShellFactory.$inject = [
    'ALARM_MODIFY_COMPARE_KEYS'
  ];

  function VAlarmShellFactory(ALARM_MODIFY_COMPARE_KEYS) {
    function VAlarmShell(valarm, vevent) {
      this.valarm = valarm;
      this.vevent = vevent;
    }

    VAlarmShell.prototype = {
      get action() { return this.valarm.getFirstPropertyValue('action'); },
      get trigger() { return this.valarm.getFirstPropertyValue('trigger'); },
      get description() { return this.valarm.getFirstPropertyValue('description'); },
      get summary() { return this.valarm.getFirstPropertyValue('summary'); },
      get attendee() { return this.valarm.getFirstPropertyValue('attendee'); },
      equals: equals
    };

    return VAlarmShell;

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
