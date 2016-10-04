(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventConsultFormSubheader', eventConsultFormSubheader);

  function eventConsultFormSubheader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-consult-form/event-consult-form-sub-header.html',
      replace: true
    };

    return directive;
  }

})();
