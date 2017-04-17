(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('applicationMenuCalendar', applicationMenuCalendar);

  function applicationMenuCalendar(applicationMenuTemplateBuilder, CAL_MODULE_METADATA) {
    var directive = {
      restrict: 'E',
      template: applicationMenuTemplateBuilder('/#/calendar', { url: CAL_MODULE_METADATA.icon }, 'Calendar'),
      replace: true
    };

    return directive;
  }

})();
