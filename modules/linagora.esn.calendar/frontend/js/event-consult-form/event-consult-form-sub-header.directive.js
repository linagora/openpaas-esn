(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventConsultFormSubheader', eventConsultFormSubheader);

  function eventConsultFormSubheader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/views/event-consult-form/event-consult-form-subheader.html',
      replace: true,
    };

    return directive;
  }

})();
