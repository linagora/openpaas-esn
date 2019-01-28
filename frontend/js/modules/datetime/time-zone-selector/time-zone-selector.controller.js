(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .controller('esnDatetimeTimeZoneSelectorController', esnDatetimeTimeZoneSelectorController);

  function esnDatetimeTimeZoneSelectorController(ESN_DATETIME_TIMEZONE) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.timeZones = ESN_DATETIME_TIMEZONE;
    }
  }
})(angular);
