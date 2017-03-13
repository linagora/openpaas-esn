(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarTodayButtonController', CalendarTodayButtonController);

  function CalendarTodayButtonController() {
    this.todayDate = new Date();
  }
})();
