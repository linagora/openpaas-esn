'use strict';

angular.module('esn.calendar')

  .constant('CONSULT_FORM_FOOTER_HEIGHT', 30)

  .constant('CONSULT_FORM_TABS', {
    MAIN: 'main',
    ATTENDEES: 'attendees',
    MORE: 'more'
  })

  .directive('eventConsultForm', function(headerService) {
    function link(scope) {
      headerService.subHeader.resetInjections();
      headerService.subHeader.addInjection('event-consult-form-subheader', scope);

      scope.$on('$destroy', function() {
        headerService.subHeader.resetInjections();
      });

      scope.modifyEventParticipation = function(partstat) {
        scope.changeParticipation(partstat);
        scope.modifyEvent();
      };
    }

    return {
      restrict: 'E',
      replace: true,
      scope: {
        event: '='
      },
      controller: 'eventFormController',
      template: '<div><event-consult-form-body/></div>',
      link: link
    };
  })

  .directive('eventConsultFormBody', function($window, CONSULT_FORM_FOOTER_HEIGHT, CONSULT_FORM_TABS) {
    function link(scope, element) {
      scope.selectedTab = CONSULT_FORM_TABS.MAIN;
      scope.getMainView = function() {
        scope.selectedTab = CONSULT_FORM_TABS.MAIN;
      };
      scope.getAttendeesView = function() {
        scope.selectedTab = CONSULT_FORM_TABS.ATTENDEES;
      };
      scope.getMoreView = function() {
        scope.selectedTab = CONSULT_FORM_TABS.MORE;
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-consult-form/event-consult-form.html',
      link: link
    };
  })

  .directive('eventConsultFormSubheader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-consult-form/event-consult-form-subheader.html'
    };
  });
