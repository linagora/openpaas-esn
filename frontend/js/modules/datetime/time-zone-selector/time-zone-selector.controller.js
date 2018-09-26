(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .controller('esnDatetimeTimeZoneSelectorController', esnDatetimeTimeZoneSelectorController);

  function esnDatetimeTimeZoneSelectorController(moment) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.timeZones = moment.tz.names();
    }
  }
})(angular);
