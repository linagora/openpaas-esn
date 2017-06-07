(function(angular) {
  'use strict';

  angular.module('esn.business-hours')
    .controller('esnBusinessHoursWorkingHoursController', esnBusinessHoursWorkingHoursController);

    function esnBusinessHoursWorkingHoursController(moment, clockpickerService) {
      var self = this;
      var todayMoment = moment(); // because the clockpicker requires ng-model as moment object

      self.$onInit = $onInit;
      self.onStartChange = onStartChange;
      self.onEndChange = onEndChange;

      function $onInit() {
        self.display = {
          start: stringToMoment(self.start),
          end: stringToMoment(self.end)
        };
      }

      function onStartChange() {
        self.display = ensureStartBeforeEnd(self.display.start, self.display.end, true);
        self.start = momentToString(self.display.start);
        self.end = momentToString(self.display.end);
      }

      function onEndChange() {
        self.display = ensureStartBeforeEnd(self.display.start, self.display.end, false);
        self.start = momentToString(self.display.start);
        self.end = momentToString(self.display.end);
      }

      function stringToMoment(timeInDay) {
        var time = clockpickerService.parseTime(false, false, timeInDay);

        return todayMoment.clone().hour(time.hour).minute(time.minute).second(0);
      }

      function momentToString(momentObj) {
        return momentObj.hours() + ':' + momentObj.minutes();
      }

      function ensureStartBeforeEnd(start, end, keepStart) {
        if (start.isAfter(end)) { // both cloned from todayMoment so we can compare time by this API
          return keepStart ? {
            start: start,
            end: start.clone()
          } : {
            start: end.clone(),
            end: end
          };
        }

        return {
          start: start,
          end: end
        };
      }
    }
})(angular);
