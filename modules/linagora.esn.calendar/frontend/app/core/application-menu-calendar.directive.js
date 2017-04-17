(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('applicationMenuCalendar', applicationMenuCalendar);

  function applicationMenuCalendar(applicationMenuTemplateBuilder) {
    var directive = {
      restrict: 'E',
      template: applicationMenuTemplateBuilder('/#/calendar', { url: '/calendar/images/calendar-icon.svg' }, 'Calendar'),
      replace: true
    };

    return directive;
  }

})();
