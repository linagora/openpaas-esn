(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calEventFullFormSubheader', calEventFullFormSubheader);

  function calEventFullFormSubheader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-full-form/event-full-form-sub-header.html',
      replace: true
    };

    return directive;
  }

})();
