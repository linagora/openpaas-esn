'use strict';

angular.module('esn.calendar')

  /**
   * There are 3 types of form in the module:
   *   * The quick form: this is a desktop only view of an edition form for events.
   *   * The full form: this is a desktop and mobile view of an complete edition form for events.
   *   * The consult form: this is a desktop and mobile view of an consult form for events.
   * Note that mobile devices have only access to the full form and the consult form.
   * This service will open the correct form corresponding to the event and the screen size.
   */
  .factory('openEventForm', function($state, $modal, screenSize, calendarService, eventUtils) {
    return function openEventForm(event) {

      function openForm(event) {
        eventUtils.setEditedEvent(event);
        if (screenSize.is('xs, sm')) {
          if (eventUtils.isOrganizer(event)) {
            $state.go('calendar.event.form', {calendarId: calendarService.calendarHomeId, eventId: event.id});
          } else {
            $state.go('calendar.event.consult', {calendarId: calendarService.calendarHomeId, eventId: event.id});
          }
        } else {
          $modal({
            templateUrl: '/calendar/views/event-quick-form/event-quick-form-view',
            resolve: {
              event: function(eventUtils) {
                return eventUtils.getEditedEvent();
              }
            },
            controller: function($scope, event) {
              $scope.event = event;
            },
            backdrop: 'static',
            placement: 'center'
          });
        }
      }

      if (!event.isInstance()) {
        openForm(event);
      } else {
        $modal({
          templateUrl: '/calendar/views/event-quick-form/edit-instance-or-all-instance',
          resolve: {
            event: function() {
              return event;
            },
            openForm: function() {
              return openForm;
            }
          },
          controller: function($scope, event, openForm) {
            $scope.event = event;
            $scope.editAllInstances = function() {
              $scope.$hide();
              event.getModifiedMaster().then(openForm);
            };

            $scope.editInstance = function() {
              $scope.$hide();
              openForm(event);
            };
          },
          openForm: openForm,
          placement: 'center'
        });
      }
    };
  });
