(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('eventUtils', eventUtils);

  eventUtils.$inject = [
    '_',
    'escapeHtmlUtils',
    'session',
    'CALENDAR_DEDAULT_EVENT_COLOR',
    'SIGNIFICANT_CHANGE_KEYS'
  ];

  function eventUtils(_, escapeHtmlUtils, session, CALENDAR_DEDAULT_EVENT_COLOR, SIGNIFICANT_CHANGE_KEYS) {
    var editedEvent = null;
    var newAttendees = null;

    var service = {
      editedEvent: editedEvent,
      render: render,
      isNew: isNew,
      isInvolvedInATask: isInvolvedInATask,
      isOrganizer: isOrganizer,
      hasSignificantChange: hasSignificantChange,
      hasAttendees: hasAttendees,
      hasAnyChange: hasAnyChange,
      getEditedEvent: getEditedEvent,
      setEditedEvent: setEditedEvent,
      getNewAttendees: getNewAttendees,
      setNewAttendees: setNewAttendees,
      setBackgroundColor: setBackgroundColor,
      resetStoredEvents: resetStoredEvents,
      applyReply: applyReply
    };

    return service;

    ////////////

    function render(event, element) {
      var timeSpan = element.find('.fc-time span');
      var title = element.find('.fc-title');

      if (event.location) {
        title.append(angular.element('<div class="fc-location"><i class="mdi mdi-map-marker"/>' + escapeHtmlUtils.escapeHTML(event.location) + '</div>'));
      }

      if (event.description) {
        element.attr('title', escapeHtmlUtils.escapeHTML(event.description));
      }

      var userAsAttendee = null;

      if (event.attendees) {
        event.attendees.forEach(function(att) {
          if (att.email in session.user.emailMap) {
            userAsAttendee = att;
          }
        });
      }

      if (event.isInstance()) {
        element.addClass('event-is-instance');
        angular.element('<i class="mdi mdi-sync"/>').insertBefore(timeSpan);
      }

      if (!isOrganizer(event)) {
        event.startEditable = false;
        event.durationEditable = false;
      }

      if (userAsAttendee) {
        if (userAsAttendee.partstat === 'NEEDS-ACTION') {
          element.addClass('event-needs-action');
        } else if (userAsAttendee.partstat === 'TENTATIVE') {
          element.addClass('event-tentative');
          angular.element('<i class="mdi mdi-help-circle"/>').insertBefore(timeSpan);
        } else if (userAsAttendee.partstat === 'ACCEPTED') {
          element.addClass('event-accepted');
        } else if (userAsAttendee.partstat === 'DECLINED') {
          element.addClass('event-declined');
        }
      }
    }

    /**
     * Return true or false either the event is new (not in caldav yet) or not.
     * We are using etag which is filled by the caldav server on creation
     * @param  {CalendarShell}  event the event to checkbox
     * @return {Boolean}        true if event is not yet on the server, false otherwise
     */
    function isNew(event) {
      return angular.isUndefined(event.etag);
    }

    /**
     * Return true or false either the event is involved in a graceperiod task
     * @param  {CalendarShell}  event the event to checkbox
     * @return {Boolean}
     */
    function isInvolvedInATask(event) {
      return !angular.isUndefined(event.gracePeriodTaskId);
    }

    function isOrganizer(event) {
      var organizerMail = event && event.organizer && (event.organizer.email || event.organizer.emails[0]);

      return !organizerMail || (organizerMail in session.user.emailMap);
    }

    function hasSignificantChange(oldEvent, newEvent) {
      return !oldEvent.equals(newEvent, SIGNIFICANT_CHANGE_KEYS);
    }

    function hasAnyChange(oldEvent, newEvent) {
      return !oldEvent.equals(newEvent);
    }

    function hasAttendees(event) {
      return angular.isArray(event.attendees) && event.attendees.length > 0;
    }

    function getNewAttendees() {
      return newAttendees;
    }

    function setNewAttendees(attendees) {
      newAttendees = attendees;
    }

    function getEditedEvent() {
      return editedEvent;
    }

    function setEditedEvent(event) {
      editedEvent = event;
    }

    function resetStoredEvents() {
      editedEvent = {};
      newAttendees = [];
    }

    function applyReply(originalEvent, reply) {
      reply.vcalendar.getFirstSubcomponent('vevent').getAllProperties('attendee').forEach(function(replyAttendee) {
        originalEvent.vcalendar.getFirstSubcomponent('vevent').getAllProperties('attendee').forEach(function(attendee) {
          if (replyAttendee.getFirstValue() === attendee.getFirstValue()) {
            attendee.setParameter('partstat', replyAttendee.getParameter('partstat'));
          }
        });
      });

      return originalEvent;
    }

    function setBackgroundColor(event, calendars) {
      event.backgroundColor = (_.find(calendars, {id: event.calendarId}) || {color: CALENDAR_DEDAULT_EVENT_COLOR}).color;

      return event;
    }

  }

})();
