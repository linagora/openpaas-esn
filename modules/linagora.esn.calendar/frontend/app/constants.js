(function() {
  'use strict';

  angular.module('esn.calendar')

    .constant('UI_CONFIG', {
      calendar: {
        defaultView: 'agendaWeek',
        theme: true,
        height: 450,
        editable: true,
        selectable: true,
        timezone: 'local',
        nowIndicator: true,
        defaultTimedEventDuration: '00:30:00',
        forceEventDuration: true,
        weekNumbers: true,
        firstDay: 1,
        header: {
          left: 'prev, next, today',
          center: 'title',
          right: 'month,agendaWeek,agendaDay'
        },
        buttonText: {
          today: 'Today',
          month: 'month',
          week: 'week',
          day: 'day'
        },
        handleWindowResize: false,
        views: {
          agendaThreeDays: {
            type: 'agendaWeek',
            duration: { days: 3 },
            buttonText: '3 days',
            eventLimit: 3,
            eventLimitClick: 'dayWithDisplayedEvent'
          },
          month: {
            eventLimit: true,
            eventLimitClick: 'dayWithDisplayedEvent'
          },
          week: {
            eventLimit: 3,
            eventLimitClick: 'dayWithDisplayedEvent',
            eventLimitText: '...'
          },
          day: {
            eventLimit: true,
            eventLimitClick: 'dayWithDisplayedEvent'
          },
          dayWithDisplayedEvent: {
            type: 'agendaDay',
            eventLimit: false
          }
        }
      },
      miniCalendar: {
        defaultView: 'month',
        height: 250,
        editable: false,
        timezone: 'local',
        weekNumbers: false,
        header: {
          left: 'prev',
          center: 'title',
          right: 'next'
        }
      }
    })

    .constant('CALENDAR_AVAILABLE_VIEWS', ['agendaWeek', 'agendaDay', 'month', 'agendaThreeDays', 'basicDay'])

    .constant('CALENDAR_RIGHT', {
      NONE: 'none',
      FREE_BUSY: 'free busy',
      READ: 'read',
      READ_WRITE: 'read write',
      ADMIN: 'admin',
      CUSTOM: 'custom'
    })

    .constant('MAX_RRULE_COUNT', 3499)

    .constant('MAX_CALENDAR_RESIZE_HEIGHT', 1107)

    .constant('CALENDAR_DEDAULT_EVENT_COLOR', '#2196f3')

    .constant('LEFT_PANEL_BOTTOM_MARGIN', 15)

    .constant('EVENT_FORM', {
      title: {
        default: 'No title',
        maxlength: 1024
      },
      location: {
        maxlength: 1024
      }
    })

    .constant('AUTOCOMPLETE_MAX_RESULTS', 5)

    .constant('DAV_PATH', '/dav/api')

    .constant('CALENDAR_GRACE_DELAY', 10000)

    .constant('CALENDAR_ERROR_DISPLAY_DELAY', 8000)

    /**
     * When checking if an event has been modified in the event form, these JSON
     * keys on the calendar shell will be checked.
     */
    .constant('EVENT_MODIFY_COMPARE_KEYS', ['attendees', 'title', 'start', 'end', 'allDay', 'location', 'description', 'rrule', 'alarm'])

    /**
     * When checking rrule comparison, these JSON keys on the rrule shell will be checked.
     */
    .constant('RRULE_MODIFY_COMPARE_KEYS', ['freq', 'interval', 'until', 'count', 'byday'])

    /**
     * When checking alarm comparison, these JSON keys on the alarm shell will be checked.
     */
    .constant('ALARM_MODIFY_COMPARE_KEYS', ['action', 'attendee', 'description', 'summary', 'trigger'])

    /**
     * see RFC 5546 https://tools.ietf.org/html/rfc5546#page-11
     */
    .constant('SIGNIFICANT_CHANGE_KEYS', ['start', 'end', 'duration', 'due', 'rrule', 'rdate', 'exdate', 'status'])

    .constant('CALENDAR_MODIFY_COMPARE_KEYS', ['name', 'color'])

    .constant('MASTER_EVENT_CACHE_TTL', 300000)

    .constant('DEFAULT_CALENDAR_ID', 'events')

    .constant('CALENDAR_EVENTS', {
      CALENDAR_HEIGHT: 'calendar:height',
      CALENDAR_REFRESH: 'calendar:refresh',
      CALENDAR_UNSELECT: 'calendar:unselect',
      EVENT_ATTENDEES_UPDATE: 'calendar:eventAttendeesUpdate',
      HOME_CALENDAR_VIEW_CHANGE: 'calendar:homeViewChange',
      ITEM_ADD: 'calendar:itemAdd',
      ITEM_MODIFICATION: 'calendar:itemModification',
      ITEM_REMOVE: 'calendar:itemRemove',
      REVERT_MODIFICATION: 'calendar:revertModification',
      VIEW_TRANSLATION: 'calendar:viewTranslation',
      CALENDARS: {
        ADD: 'calendar:calendars:add',
        REMOVE: 'calendar:calendars:remove',
        TOGGLE_VIEW: 'calendar:calendars:toggleView',
        TOGGLE_VIEW_MODE: 'calendar:calendars:toggleViewMode',
        TODAY: 'calendar:calendars:today',
        RIGHTS_UPDATE: 'calendar:calendars:rightsUpdate'
      },
      MINI_CALENDAR: {
        DATE_CHANGE: 'calendar:mini:dateChange',
        TOGGLE: 'calendar:mini:toggle',
        VIEW_CHANGE: 'calendar:mini:viewchange'
      },
      WS: {
        EVENT_CREATED: 'calendar:ws:event:created',
        EVENT_UPDATED: 'calendar:ws:event:updated',
        EVENT_REQUEST: 'calendar:ws:event:request',
        EVENT_CANCEL: 'calendar:ws:event:cancel',
        EVENT_DELETED: 'calendar:ws:event:deleted',
        EVENT_REPLY: 'calendar:ws:event:reply'
      },
      MODAL: 'calendar:modal'
    })

    .constant('CALENDAR_MAX_DURATION_OF_SMALL_EVENT', 45);

})();
