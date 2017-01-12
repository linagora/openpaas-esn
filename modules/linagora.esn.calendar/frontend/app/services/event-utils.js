(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calEventUtils', calEventUtils);

  function calEventUtils(_, escapeHtmlUtils, session, matchmedia, CALENDAR_DEDAULT_EVENT_COLOR, SIGNIFICANT_CHANGE_KEYS, CALENDAR_MAX_DURATION_OF_SMALL_EVENT, SM_XS_MEDIA_QUERY) {
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
      applyReply: applyReply,
      getUserAttendee: getUserAttendee
    };

    return service;

    ////////////

    function render(event, element, view) {
      var timeDiv = element.find('.fc-time');
      var title = element.find('.fc-title');
      var eventDurationInMinute = event.end.diff(event.start, 'minutes');
      var userAsAttendee = getUserAttendee(event);
      var eventIconsDivInMobile;

      addTooltipToEvent();
      changeEventColorWhenMonthView();
      adaptTitleWhenShortEvent();
      appendLocation();
      appendDescription();
      checkUserIsOrganizer();
      addIcons();

      function addTooltipToEvent() {
        element.find('.fc-content').attr('title', event.title);
      }

      function changeEventColorWhenMonthView() {
        if ((view.name === 'month') && !event.allDay && event.isOverOneDayOnly()) {
          var eventColor = element.css('background-color');

          element.css('color', eventColor);
          element.css('border', '0');
          timeDiv.css('background-color', 'transparent');
          element.css('background-color', 'transparent');
        }
      }

      function adaptTitleWhenShortEvent() {
        if ((eventDurationInMinute <= CALENDAR_MAX_DURATION_OF_SMALL_EVENT.DESKTOP) && element.find('.fc-time').length) {
          element.find('.fc-time').attr('data-start', event.start.format('hh:mm') + ' - ' + event.title);
        }
      }

      function appendLocation() {
        if (event.location) {
          element.addClass('event-with-location');
          title.append(angular.element('<div class="fc-location"><i class="mdi mdi-map-marker"/>' + escapeHtmlUtils.escapeHTML(event.location) + '</div>'));
        }
      }

      function appendDescription() {
        if (event.description) {
          element.attr('title', escapeHtmlUtils.escapeHTML(event.description));
        }
      }

      function checkUserIsOrganizer() {
        if (!isOrganizer(event)) {
          event.startEditable = false;
          event.durationEditable = false;
        }
      }

      function addIcons() {
        if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
          title.append(angular.element('<div class="event-icons-mobile"></div>'));
          eventIconsDivInMobile = title.find('.event-icons-mobile');

          addIconInEventInstanceInMobile();

          addIconForAttendeesInMobile();
        } else {
          addIconInEventInstanceInDesktop();

          addIconForAttendeesInDesktop();
        }
      }

      function addIconInEventInstanceInMobile() {
        if (event.isInstance()) {
          element.addClass('event-is-instance');

          if (event.allDay) {
            title.prepend('<i class="mdi mdi-sync"/>');
          } else {
            eventDurationInMinute <= CALENDAR_MAX_DURATION_OF_SMALL_EVENT.MOBILE ? title.prepend('<i class="mdi mdi-sync"/>') : eventIconsDivInMobile.append('<i class="mdi mdi-sync"/>');
          }
        }
      }

      function addIconForAttendeesInMobile() {
        if (userAsAttendee) {
          if (userAsAttendee.partstat === 'NEEDS-ACTION') {
            element.addClass('event-needs-action');
          } else if (userAsAttendee.partstat === 'TENTATIVE') {
            element.addClass('event-tentative');

            if (event.allDay) {
              title.prepend('<i class="mdi mdi-help-circle"/>');
            } else {
              eventDurationInMinute <= CALENDAR_MAX_DURATION_OF_SMALL_EVENT.MOBILE ? title.prepend('<i class="mdi mdi-help-circle"/>') : eventIconsDivInMobile.append('<i class="mdi mdi-help-circle"/>');
            }
          } else if (userAsAttendee.partstat === 'ACCEPTED') {
            element.addClass('event-accepted');
          } else if (userAsAttendee.partstat === 'DECLINED') {
            element.addClass('event-declined');
          }
        }
      }

      function addIconInEventInstanceInDesktop() {
        if (event.isInstance()) {
          element.addClass('event-is-instance');

          event.allDay ? title.prepend('<i class="mdi mdi-sync"/>') : timeDiv.prepend('<i class="mdi mdi-sync"/>');
        }
      }

      function addIconForAttendeesInDesktop() {
        if (userAsAttendee) {
          if (userAsAttendee.partstat === 'NEEDS-ACTION') {
            element.addClass('event-needs-action');
          } else if (userAsAttendee.partstat === 'TENTATIVE') {
            element.addClass('event-tentative');

            if (event.allDay) {
              title.prepend('<i class="mdi mdi-help-circle"/>');
            } else {
              timeDiv.prepend('<i class="mdi mdi-help-circle"/>');
            }
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

    function getUserAttendee(event) {
      return _.find(event.attendees, function(attendee) {
        return attendee.email in session.user.emailMap;
      });
    }
  }

})();
