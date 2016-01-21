'use strict';

angular.module('esn.calendar')
  .directive('eventQuickFormWizard', function(WidgetWizard) {
    function link($scope) {
      $scope.wizard = new WidgetWizard([
        '/calendar/views/event-quick-form/event-quick-form-wizard-step-0'
      ]);
    }
    return {
      restrict: 'E',
      templateUrl: '/calendar/views/event-quick-form/event-quick-form-wizard',
      scope: {
        user: '=',
        domain: '=',
        createModal: '=',
        selectedEvent: '='
      },
      link: link
    };
  })
  .directive('eventQuickForm', function($location, $timeout, eventUtils) {
    function link(scope, element, attrs, controller) {
      controller.initFormData();

      scope.closeModal = function() {
        eventUtils.setEditedEvent(scope.editedEvent);
        scope.createModal.hide();
      };

      scope.isNew = eventUtils.isNew;
      scope.isInvolvedInATask = eventUtils.isInvolvedInATask;
      scope.deleteEvent = controller.deleteEvent;
      scope.submit = eventUtils.isNew(scope.editedEvent) && !eventUtils.isInvolvedInATask(scope.editedEvent) ? controller.addNewEvent : controller.modifyEvent;
      scope.changeParticipation = controller.changeParticipation;
      scope.canPerformCall = controller.canPerformCall;

      scope.goToFullForm = function() {
        eventUtils.setEditedEvent(scope.editedEvent);
        scope.closeModal();
        $location.path('/calendar/event-full-form');
      };

      $timeout(function() {
        element.find('.title')[0].focus();
      }, 0);

      scope.focusSubmitButton = function() {
        $timeout(function() {
          element.find('button[type="submit"]').focus();
        });
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
      templateUrl: '/calendar/views/event-quick-form/event-quick-form.html',
      link: link
    };
  })

  .directive('backCloseModal', function() {
    return {
      restrict: 'A',
      link: function(scope) {
        scope.$on('$locationChangeStart', function(event) {
          if (!!scope.createModal && scope.createModal.$isShown) {
            event.preventDefault();
            scope.closeModal();
          }
        });
      }
    };
  });
