'use strict';

angular.module('esn.calendar')

  .constant('COMMUNITY_UI_CONFIG', {
    calendar: {
      height: 450,
      editable: true,
      timezone: 'local',
      forceEventDuration: true,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      }
    }
  })

  .constant('USER_UI_CONFIG', {
    calendar: {
      defaultView: 'agendaWeek',
      theme: true,
      height: 450,
      editable: true,
      selectable: true,
      timezone: 'local',
      nowIndicator: true,
      forceEventDuration: true,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev, next, today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      // TODO: i18n
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
          buttonText: '3 days'
        },
        month: {
          eventLimit: 3,
          eventLimitClick: 'day'
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

  .constant('CALENDAR_AVAILABLE_VIEWS', ['agendaWeek', 'agendaDay', 'month', 'agendaThreeDays'])

  .constant('MAX_CALENDAR_RESIZE_HEIGHT', 1107)

  .constant('CALENDAR_DEDAULT_EVENT_COLOR', '#2196f3')

  .constant('LEFT_PANEL_BOTTOM_MARGIN', 15)

  .constant('EVENT_FORM', {
    title: {
      // TODO: i18n
      default: 'No title',
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
  .constant('EVENT_MODIFY_COMPARE_KEYS', ['attendees', 'title', 'start', 'end', 'allDay', 'location', 'description'])

  .constant('CALENDAR_MODIFY_COMPARE_KEYS', ['name'])

  .constant('MASTER_EVENT_CACHE_TTL', 300000)

  .constant('CALENDAR_EVENTS', {
    CALENDAR_HEIGHT: 'calendar:height',
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
      TOGGLE_VIEW: 'calendar:calendars:toggleView'
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
    }
  });
