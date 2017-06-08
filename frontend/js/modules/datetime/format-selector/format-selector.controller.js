(function(angular) {
  'use strict';

  angular.module('esn.datetime')
    .controller('esnDatetimeFormatSelectorController', esnDatetimeFormatSelectorController);

  var AVAILABLE_DATE_FORMATS = [
    'EEEE, MMMM d, y',
    'EEEE, d MMMM, y',
    'MMMM d, y',
    'd MMMM, y',
    'MM/dd/yyyy',
    'dd/MM/yyyy'
  ];
  var AVAILABLE_TIME_FORMATS = [
    'h:mm a',
    'H:mm'
  ];

  function esnDatetimeFormatSelectorController() {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.currentDate = new Date();
      self.AVAILABLE_DATE_FORMATS = AVAILABLE_DATE_FORMATS;
      self.AVAILABLE_TIME_FORMATS = AVAILABLE_TIME_FORMATS;
    }

  }
})(angular);
