(function() {
  'use strict';

  angular.module('esn.calendar')
         .controller('calAttendeesAutocompleteInputController', calAttendeesAutocompleteInputController);

  function calAttendeesAutocompleteInputController(calendarAttendeeService, naturalService, session, CAL_AUTOCOMPLETE_MAX_RESULTS) {
    var self = this;

    self.mutableAttendees = self.mutableAttendees || [];
    self.onAddingAttendee = onAddingAttendee;
    self.getInvitableAttendees = getInvitableAttendees;

    ////////////

    function onAddingAttendee(att) {
      if (!att.id) {
        att.id = att.displayName;
        att.email = att.displayName;
      }

      return !_isDuplicateAttendee(att, _getAddedAttendeeIds());
    }

    function getInvitableAttendees(query) {
      self.query = query;

      return calendarAttendeeService.getAttendeeCandidates(query, CAL_AUTOCOMPLETE_MAX_RESULTS * 2).then(function(attendeeCandidates) {
        attendeeCandidates = _fillNonDuplicateAttendees(attendeeCandidates);
        attendeeCandidates.sort(function(a, b) {
          return naturalService.naturalSort(a.displayName, b.displayName);
        });

        return attendeeCandidates.slice(0, CAL_AUTOCOMPLETE_MAX_RESULTS);
      });
    }

    function _fillNonDuplicateAttendees(attendees) {
      var addedAttendeeIds = _getAddedAttendeeIds();

      return attendees.filter(function(att) {
        return !_isDuplicateAttendee(att, addedAttendeeIds);
      });
    }

    function _getAddedAttendeeIds() {
      var addedAttendees = self.mutableAttendees.concat(self.originalAttendees || []);
      var addedAttendeeIds = [];

      addedAttendees.forEach(function(att) {
        addedAttendeeIds.push(att.id);
      });

      return addedAttendeeIds;
    }

    function _isDuplicateAttendee(att, addedAttendeeIds) {
      return (att.email in session.user.emailMap) || addedAttendeeIds.indexOf(att.id) > -1;
    }
  }

})();
