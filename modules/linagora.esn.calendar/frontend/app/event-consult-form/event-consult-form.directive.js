(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calEventConsultForm', calEventConsultForm);

  function calEventConsultForm() {
    var directive = {
      restrict: 'E',
      template: '<div><sub-header><cal-event-consult-form-subheader class="hidden-md" /></sub-header><cal-event-consult-form-body/></div>',
      scope: {
        event: '='
      },
      link: link,
      replace: true,
      controller: 'CalEventFormController'
    };

    return directive;

    ////////////

    function link(scope) {
      scope.isEdit = false;
      scope.modifyEventParticipation = modifyEventParticipation;
      scope.changeConsultState = changeConsultState;

      ////////////

      function modifyEventParticipation(partstat) {
        scope.changeParticipation(partstat);
        scope.modifyEvent();
      }

      function changeConsultState() {
        if (scope.isEdit) {
          scope.updateAlarm();
        }
        scope.isEdit = !scope.isEdit;
      }
    }
  }

})();
