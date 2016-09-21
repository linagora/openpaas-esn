(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventConsultForm', eventConsultForm);

eventConsultForm.$inject = ['$injector'];

  function eventConsultForm($injector) {
    var directive = {
      restrict: 'E',
      template: '<div><sub-header><event-consult-form-subheader class="hidden-md" /></sub-header><event-consult-form-body/></div>',
      scope: {
        event: '='
      },
      link: link,
      replace: true,
      controller: 'eventFormController'
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
