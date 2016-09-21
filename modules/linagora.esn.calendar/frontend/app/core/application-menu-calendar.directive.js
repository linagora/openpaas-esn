(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('applicationMenuCalendar', applicationMenuCalendar);

  applicationMenuCalendar.$inject = [
    'applicationMenuTemplateBuilder'
  ];

  function applicationMenuCalendar(applicationMenuTemplateBuilder) {
    var directive = {
      restrict: 'E',
      template: applicationMenuTemplateBuilder('/#/calendar', 'mdi-calendar', 'Calendar'),
      replace: true
    };

    return directive;
  }

})();
