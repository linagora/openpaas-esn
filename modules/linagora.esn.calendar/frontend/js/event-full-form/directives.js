'use strict';

angular.module('esn.calendar')

  .directive('eventFullForm', function($timeout, $location, eventUtils, headerService) {
    function link(scope, element, attrs, controller) {
      headerService.subHeader.addInjection('event-full-form-subheader', scope);
      controller.initFormData();

      scope.isNew = eventUtils.isNew;
      scope.deleteEvent = controller.deleteEvent;
      scope.submit = eventUtils.isNew(scope.editedEvent) ? controller.addNewEvent : controller.modifyEvent;
      scope.changeParticipation = controller.changeParticipation;
      scope.goBack = function(callback) {
        $location.path('/calendar');
        if (callback) {
          // Timeout the callback so that fullcalendar events are
          // correctly handled after location has changed.
          $timeout(callback);
        }
      };

      function _resetStoredEvents() {
        eventUtils.originalEvent = {};
        eventUtils.editedEvent = {};
      }

      element.on('$destroy', _resetStoredEvents);
      scope.$on('$destroy', headerService.subHeader.resetInjections);
    }

    return {
      restrict: 'E',
      replace: true,
      controller: 'eventFormController',
      templateUrl: '/calendar/views/event-full-form/event-full-form.html',
      link: link
    };
  })

  .directive('eventFullFormSubheader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-full-form/event-full-form-subheader.html'
    };
  });
