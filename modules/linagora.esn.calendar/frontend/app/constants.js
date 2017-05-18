(function() {
  'use strict';

  angular.module('esn.calendar')

    .constant('CAL_UI_CONFIG', {
      calendar: {
        defaultView: 'agendaWeek',
        scrollTime: '08:00:00',
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
            eventLimitClick: 'dayWithDisplayedEvent',
            eventLimitText: '...'
          },
          week: {
            eventLimit: 3,
            eventLimitClick: 'dayWithDisplayedEvent',
            eventLimitText: '...',
            columnFormat: 'ddd D'
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
        },
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      }
    })

    .constant('CAL_ACCEPT_HEADER', 'application/calendar+json')

    .constant('CAL_DAV_DATE_FORMAT', 'YYYYMMDD[T]HHmmss')

    .constant('CAL_ICAL', {
      partstat: {
        needsaction: 'NEEDS-ACTION',
        accepted: 'ACCEPTED',
        declined: 'DECLINED',
        tentative: 'TENTATIVE'
      },
      rsvp: {
        true: 'TRUE',
        false: 'FALSE'
      },
      role: {
        reqparticipant: 'REQ-PARTICIPANT',
        chair: 'CHAIR'
      }
    })

    .constant('CAL_AVAILABLE_VIEWS', ['agendaWeek', 'agendaDay', 'month', 'agendaThreeDays', 'basicDay'])

    .constant('CAL_CALENDAR_SHARED_RIGHT', {
      NONE: '0',
      SHAREE_OWNER: '1',
      SHAREE_READ: '2',
      SHAREE_READ_WRITE: '3',
      SHAREE_ADMIN: '5',
      SHAREE_FREE_BUSY: '6'
    })

    .constant('CAL_CALENDAR_PUBLIC_RIGHT', {
      NONE: '',
      READ: '{DAV:}read',
      READ_WRITE: '{DAV:}write',
      FREE_BUSY: '{urn:ietf:params:xml:ns:caldav}read-free-busy'
    })

    .constant('CAL_CALENDAR_PUBLIC_RIGHT_HUMAN_READABLE', {
      unknown: 'unknown',
      '': 'none',
      '{DAV:}read': 'read',
      '{DAV:}write': 'read/write',
      '{urn:ietf:params:xml:ns:caldav}read-free-busy': 'free/busy'
    })

    .constant('CAL_EVENT_CLASS', {
      PUBLIC: 'PUBLIC',
      PRIVATE: 'PRIVATE'
    })

    .constant('CAL_MAX_RRULE_COUNT', 3499)

    .constant('CAL_MAX_CALENDAR_RESIZE_HEIGHT', 1107)

    .constant('CAL_DEFAULT_EVENT_COLOR', '#2196f3')

    .constant('CAL_LEFT_PANEL_BOTTOM_MARGIN', 15)

    .constant('CAL_EVENT_FORM', {
      title: {
        default: 'No title',
        maxlength: 1024
      },
      location: {
        maxlength: 1024
      },
      class: {
        default: 'PUBLIC',
        values: [
          {
            value: 'PUBLIC',
            label: 'Public'
          },
          {
            value: 'PRIVATE',
            label: 'Private'
          }
        ]
      }
    })

    .constant('CAL_AUTOCOMPLETE_MAX_RESULTS', 5)

    .constant('CAL_DAV_PATH', '/dav/api')

    .constant('CAL_GRACE_DELAY', 10000)

    .constant('CAL_ERROR_DISPLAY_DELAY', 8000)

    .constant('CAL_RESIZE_DEBOUNCE_DELAY', 250)

    /**
     * When checking if an event has been modified in the event form, these JSON
     * keys on the calendar shell will be checked.
     */
    .constant('CAL_EVENT_MODIFY_COMPARE_KEYS', ['attendees', 'title', 'start', 'end', 'allDay', 'location', 'description', 'rrule', 'alarm', 'class'])

    /**
     * When checking rrule comparison, these JSON keys on the rrule shell will be checked.
     */
    .constant('CAL_RRULE_MODIFY_COMPARE_KEYS', ['freq', 'interval', 'until', 'count', 'byday'])

    /**
     * When checking alarm comparison, these JSON keys on the alarm shell will be checked.
     */
    .constant('CAL_ALARM_MODIFY_COMPARE_KEYS', ['action', 'attendee', 'description', 'summary', 'trigger'])

    /**
     * see RFC 5546 https://tools.ietf.org/html/rfc5546#page-11
     */
    .constant('CAL_SIGNIFICANT_CHANGE_KEYS', ['start', 'end', 'duration', 'due', 'rrule', 'rdate', 'exdate', 'status'])

    .constant('CAL_CALENDAR_MODIFY_COMPARE_KEYS', ['name', 'color'])

    .constant('CAL_MASTER_EVENT_CACHE_TTL', 300000)

    .constant('CAL_DEFAULT_CALENDAR_ID', 'events')

    .constant('CAL_SPINNER_TIMEOUT_DURATION', 2000)

    .constant('CAL_EVENTS', {
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
        UPDATE: 'calendar:calendars:update',
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
      MODAL: 'calendar:modal'
    })

    .constant('CAL_MAX_DURATION_OF_SMALL_EVENT', {
      MOBILE: 60,
      DESKTOP: 45
    })

    .constant('CAL_MODULE_METADATA', {
      id: 'linagora.esn.calendar',
      title: 'Calendar',
      icon: '/calendar/images/calendar-icon.svg',
      homePage: 'calendar.main'
    })

    .constant('CAL_WEBSOCKET', {
      NAMESPACE: '/calendars',
      EVENT: {
        CREATED: 'calendar:event:created',
        UPDATED: 'calendar:event:updated',
        REQUEST: 'calendar:event:request',
        CANCEL: 'calendar:event:cancel',
        DELETED: 'calendar:event:deleted',
        REPLY: 'calendar:event:reply'
      },
      CALENDAR: {
        CREATED: 'calendar:calendar:created',
        UPDATED: 'calendar:calendar:updated',
        DELETED: 'calendar:calendar:deleted'
      }
    })

    .constant('CAL_LIST_OF_COLORS', {
      red: '#F44336',
      pink: '#E91E63',
      purple: '#9C27B0',
      indigo: '#3F51B5',
      blue: '#2196F3',
      teal: '#009688',
      green: '#4CAF50',
      amber: '#FFC107',
      orange: '#FF9800',
      brown: '#795548'
    })

    .constant('CAL_RECUR_FREQ', [{
      value: undefined,
      label: 'No repetition'
    }, {
      value: 'DAILY',
      label: 'Repeat daily'
    }, {
      value: 'WEEKLY',
      label: 'Repeat weekly'
    }, {
      value: 'MONTHLY',
      label: 'Repeat monthly'
    }, {
      value: 'YEARLY',
      label: 'Repeat yearly'
    }])

    .constant('CAL_WEEK_DAYS', {
      M: 'MO',
      T: 'TU',
      W: 'WE',
      Th: 'TH',
      F: 'FR',
      S: 'SA',
      Su: 'SU'
    })

    .constant('CAL_MINI_CALENDAR_DAY_FORMAT', 'YYYY-MM-DD')

    .constant('CAL_CONSULT_FORM_TABS', {
      MAIN: 'main',
      ATTENDEES: 'attendees',
      MORE: 'more'
    })

    .constant('CAL_CACHED_EVENT_SOURCE_ADD', 'add')

    .constant('CAL_CACHED_EVENT_SOURCE_DELETE', 'delete')

    .constant('CAL_CACHED_EVENT_SOURCE_UPDATE', 'update')

    .constant('CAL_ALARM_TRIGGER', [{
      value: undefined,
      label: 'No alarm'
    }, {
      value: '-PT1M',
      label: '1 minute'
    }, {
      value: '-PT5M',
      label: '5 minutes'
    }, {
      value: '-PT10M',
      label: '10 minutes'
    }, {
      value: '-PT15M',
      label: '15 minutes'
    }, {
      value: '-PT30M',
      label: '30 minutes'
    }, {
      value: '-PT1H',
      label: '1 hour'
    }, {
      value: '-PT2H',
      label: '2 hours'
    }, {
      value: '-PT5H',
      label: '5 hours'
    }, {
      value: '-PT12H',
      label: '12 hours'
    }, {
      value: '-P1D',
      label: '1 day'
    }, {
      value: '-P2D',
      label: '2 days'
    }, {
      value: '-P1W',
      label: '1 week'
    }]);
})();
