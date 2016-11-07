(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calEventUtils', calEventUtils);

  calEventUtils.$inject = [
    '_',
    'escapeHtmlUtils',
    'session',
    'CALENDAR_DEDAULT_EVENT_COLOR',
    'SIGNIFICANT_CHANGE_KEYS',
    'CALENDAR_MAX_DURATION_OF_SMALL_EVENT'
  ];

  function calEventUtils(_, escapeHtmlUtils, session, CALENDAR_DEDAULT_EVENT_COLOR, SIGNIFICANT_CHANGE_KEYS, CALENDAR_MAX_DURATION_OF_SMALL_EVENT) {
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

    function render(event, element, view) {
      var timeDiv = element.find('.fc-time');
      var timeSpan = element.find('.fc-time span');
      var title = element.find('.fc-title');
      var eventDurationInMinute = event.end.diff(event.start, 'minutes');
      var userAsAttendee = null;

      changeEventColorWhenMonthView();
      adaptTitleWhenShortEvent();
      appendLocation();
      appendDescription();
      setUserAsAttendee();
      addIconInEventInstance();
      checkUserIsOrganizer();
      addIconForAttendees();

      function changeEventColorWhenMonthView() {
        if ((view.name === 'month') && !event.allDay) {
          var eventColor = element.css('background-color');
          element.css('color', eventColor);
          timeDiv.css('background-color', 'transparent');
          element.css('background-color', 'transparent');
        }
      }

      function adaptTitleWhenShortEvent() {
        if ((eventDurationInMinute <= CALENDAR_MAX_DURATION_OF_SMALL_EVENT) && element.find('.fc-time').length) {
          element.find('.fc-time').attr('data-start', event.start.format('hh:mm') + ' - ' + event.title);
        }
      }

      function appendLocation() {
        if (event.location) {
          title.append(angular.element('<div class="fc-location"><i class="mdi mdi-map-marker"/>' + escapeHtmlUtils.escapeHTML(event.location) + '</div>'));
        }
      }

      function appendDescription() {
        if (event.description) {
          element.attr('title', escapeHtmlUtils.escapeHTML(event.description));
        }
      }

      function setUserAsAttendee() {
        if (event.attendees) {
          event.attendees.forEach(function(att) {
            if (att.email in session.user.emailMap) {
              userAsAttendee = att;
            }
          });
        }
      }

      function addIconInEventInstance() {
        if (event.isInstance()) {
          element.addClass('event-is-instance');
          angular.element('<i class="mdi mdi-sync"/>').insertBefore(timeSpan);
        }
      }

      function checkUserIsOrganizer() {
        if (!isOrganizer(event)) {
          event.startEditable = false;
          event.durationEditable = false;
        }
      }

      function addIconForAttendees() {
        if (userAsAttendee) {
          if (userAsAttendee.partstat === 'NEEDS-ACTION') {
            element.addClass('event-needs-action');
          } else if (userAsAttendee.partstat === 'TENTATIVE' && timeSpan.length) {
            element.addClass('event-tentative');
            angular.element('<i class="mdi mdi-help-circle"/>').insertBefore(timeSpan);
          } else if (userAsAttendee.partstat === 'TENTATIVE' && !timeSpan.length) {
            element.addClass('event-tentative');
            title.prepend(angular.element('<i class="mdi mdi-help-circle"/>'));
          } else if (userAsAttendee.partstat === 'ACCEPTED') {
            element.addClass('event-accepted');
          } else if (userAsAttendee.partstat === 'DECLINED') {
            element.addClass('event-declined');
          }
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
