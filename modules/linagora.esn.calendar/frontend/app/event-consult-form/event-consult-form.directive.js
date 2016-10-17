(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calEventConsultForm', calEventConsultForm);

calEventConsultForm.$inject = ['$injector'];

  function calEventConsultForm($injector) {
    var directive = {
      restrict: 'E',
      template: '<div><sub-header><cal-event-consult-form-subheader class="hidden-md" /></sub-header><cal-event-consult-form-body/></div>',
      scope: {
        event: '='
      },
      link: link,
      replace: true,
      controller: 'calEventFormController'
    };

    return directive;

    ////////////

    function link(scope) {
      scope.isEdit = false;
      scope.composerExists = $injector.has('composerDirective');
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
