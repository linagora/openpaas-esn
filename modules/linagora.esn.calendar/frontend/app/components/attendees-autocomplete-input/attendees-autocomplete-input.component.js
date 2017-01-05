'use strict';

angular.module('esn.calendar')
  .component('calAttendeesAutocompleteInput', {
    templateUrl: '/calendar/app/components/attendees-autocomplete-input/attendees-autocomplete-input.html',
    bindings: {
      originalAttendees: '=',
      mutableAttendees: '='
    },
    controller: 'calAttendeesAutocompleteInputController',
    controllerAs: 'ctrl'
  });
