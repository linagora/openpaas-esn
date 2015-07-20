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
      forceEventDuration: true,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev, next, today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay,basicWeek,basicDay'
      },
      // TODO: i18n
      buttonText: {
        today: 'Today',
        month: 'month',
        week: 'week',
        day: 'day'
      },
      handleWindowResize: false
    }
  })

  .constant('EVENT_FORM', {
    title: {
      // TODO: i18n
      default: 'No title',
      maxlength: 1024
    }
  })

  .constant('AUTOCOMPLETE_MAX_RESULTS', 5)

  .constant('DAV_PATH', '/dav/api');
