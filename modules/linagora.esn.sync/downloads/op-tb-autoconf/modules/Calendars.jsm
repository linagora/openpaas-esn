'use strict';

const EXPORTED_SYMBOLS = ['Calendars'];

/////

const Cu = Components.utils;

try {
  Cu.import('resource://calendar/modules/calUtils.jsm');
} catch(e) {}

Cu.import('resource://op-tb-autoconf/modules/Log.jsm');
Cu.import('resource://op-tb-autoconf/modules/Utils.jsm');
Cu.import('resource://op-tb-autoconf/modules/Prefs.jsm');

/////

const logger = getLogger('Calendars'),
      utils = new Utils(logger),
      CALDAV = 'caldav';

const Calendars = {

  setupCalendars: function(calendarSpecs) {
    let rootUrl = Prefs.get('extensions.op.autoconf.rootUrl');

    calendarSpecs.forEach(calendarSpec => {
      let name = calendarSpec.name,
          calendar = Calendars.find(name);

      calendarSpec.uri = utils.newURI(rootUrl + calendarSpec.uri);

      if (!calendar) {
        logger.info('About to create a new ' + CALDAV + ' calendar ${name}', { name });

        calendar = cal.getCalendarManager().createCalendar(CALDAV, calendarSpec.uri);
        // Calendar should be visible and cached by default
        calendar.setProperty('calendar-main-in-composite', true);
        calendar.setProperty('cache.enabled', true);

        cal.getCalendarManager().registerCalendar(calendar);
      }

      utils.copyProperties(utils.omit(calendarSpec, 'username'), calendar);

      if (calendarSpec.color) {
        calendar.setProperty('color', calendarSpec.color);
      }
    });
  },

  find: function(name) {
    let count = {},
        calendars = cal.getCalendarManager().getCalendars(count);

    logger.info('Searching calendar ${name} amongst ${count} registered calendars', { name, count: count.value });

    for (let i in calendars) {
      if (calendars.hasOwnProperty(i)) {
        let calendar = calendars[i],
            calName = calendar.name,
            calId = calendar.id;

        logger.debug('Matching calendar ${calName} (${calId}) against ${name}', { calId, name, calName });

        if (calName === name) {
          logger.info('Returning found calendar ${calId} matching ${name}', { calId, name });

          return calendar;
        }
      }
    }

    return null;
  },

  isLightningInstalled: function() {
    let isInstalled = false;

    try {
      isInstalled = cal !== undefined;
    } catch(e) {}

    logger.debug('Lightning is ' + (!isInstalled ? 'not ' : '') + 'installed !');

    return isInstalled;
  }

};
