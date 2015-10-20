'use strict';

angular.module('esn.calendar')

  .directive('eventFullForm', function($timeout, $location, eventUtils) {
    function link(scope, element, attrs, controller) {
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
    }

    return {
      restrict: 'E',
      replace: true,
      controller: 'eventFormController',
      templateUrl: '/calendar/views/event-full-form/event-full-form.html',
      link: link
    };
  });
