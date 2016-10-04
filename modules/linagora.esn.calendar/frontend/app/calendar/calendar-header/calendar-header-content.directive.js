(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarHeaderContent', calendarHeaderContent);

  function calendarHeaderContent() {
    var directive = {
      restrict: 'A',
      template: '<span>My Calendar</span>',
      replace: true
    };

    return directive;
  }

})();
