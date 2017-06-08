(function(angular) {
  'use strict';

  var DAYS_OF_WEEK = [{
    value: 1,
    title: 'Monday'
  }, {
    value: 2,
    title: 'Tuesday'
  }, {
    value: 3,
    title: 'Wednesday'
  }, {
    value: 4,
    title: 'Thursday'
  }, {
    value: 5,
    title: 'Friday'
  }, {
    value: 6,
    title: 'Saturday'
  }, {
    value: 0,
    title: 'Sunday'
  }];

  angular.module('esn.business-hours')
    .controller('esnBusinessHoursWorkingDaysController', esnBusinessHoursWorkingDaysController);

    function esnBusinessHoursWorkingDaysController(_) {
      var self = this;

      self.$onInit = $onInit;
      self.onDayChange = onDayChange;

      function $onInit() {
        self.days = angular.copy(DAYS_OF_WEEK).map(function(day) {
          day.selected = self.daysOfWeek.indexOf(day.value) > -1;

          return day;
        });
      }

      function onDayChange() {
        self.daysOfWeek = self.days
          .filter(_.property('selected'))
          .map(_.property('value'));
      }
    }
})(angular);
