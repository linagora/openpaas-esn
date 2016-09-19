(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventFullFormSubheader', eventFullFormSubheader);

  function eventFullFormSubheader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/views/event-full-form/event-full-form-subheader.html',
      replace: true,
    };

    return directive;
  }

})();
