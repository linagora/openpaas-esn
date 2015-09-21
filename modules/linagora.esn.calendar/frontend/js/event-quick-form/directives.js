'use strict';

angular.module('esn.calendar')
  .directive('eventQuickFormWizard', function(WidgetWizard, $rootScope) {
    function link($scope, element) {
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

  .directive('eventCreateButton', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/calendar/views/event-quick-form/event-create-button.html'
    };
  })

  .directive('eventQuickForm', function($location, $timeout, eventService) {
    function link($scope, element, attrs, controller) {
      controller.initFormData();

      $scope.closeModal = function() {
        $scope.createModal.hide();
      };

      $scope.isNew = controller.isNew;
      $scope.deleteEvent = controller.deleteEvent;
      $scope.submit = controller.isNew($scope.editedEvent) ? controller.addNewEvent : controller.modifyEvent;
      $scope.changeParticipation = controller.changeParticipation;
      $scope.canPerformCall = controller.canPerformCall;

      $scope.goToFullForm = function() {
        $scope.closeModal();
        $location.path('/calendar/event-full-form');
      };

      $timeout(function() {
        element.find('.title')[0].focus();
      }, 0);

      $scope.focusSubmitButton = function() {
        $timeout(function() {
          element.find('button[type="submit"]').focus();
        });
      };

      function _resetStoredEvents() {
        eventService.originalEvent = {};
        eventService.editedEvent = {};
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
          event.preventDefault();
          if (scope.createModal) {
            scope.closeModal();
          }
        });
      }
    };
  });
