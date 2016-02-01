'use strict';

angular.module('esn.calendar')

  /**
   * There are 3 types of form in the module:
   *   * The quick form: this is a desktop only view of an edition form for events.
   *   * The full form: this is a desktop and mobile view of an complete edition form for events.
   *   * The consult form: this is a desktop and mobile view of an consult form for events.
   * Note that mobile devices have only access to the full form and the consult form.
   * This service will open the correct form corresponding to the event and the screen size.
   * Event is stored in scope.event.
   */
  .factory('openEventForm', function($state, $modal, screenSize, eventUtils) {
    return function openEventForm(scope) {
      if (screenSize.is('xs, sm')) {
        if (eventUtils.isOrganizer(scope.event)) {
          $state.go('calendar.eventEdit');
        } else {
          $state.go('calendar.eventConsult');
        }
      } else {
        $modal({scope: scope, templateUrl: '/calendar/views/event-quick-form/event-quick-form-modal', backdrop: 'static', placement: 'center'});
      }
    };
  });
