(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventFullFormSubheader', eventFullFormSubheader);

  function eventFullFormSubheader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-full-form/event-full-form-sub-header.html',
      replace: true
    };

    return directive;
  }

})();
