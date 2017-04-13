'use strict';

const _ = require('lodash');
const WEBSOCKET = require('../../lib/constants').WEBSOCKET;

module.exports = dependencies => {
  const io = dependencies('wsserver').io;
  const ioHelper = dependencies('wsserver').ioHelper;
  const logger = dependencies('logger');

  return {
    notify
  };

  function notify(topic, message) {
    let calendarHomeId;

    try {
      calendarHomeId = parseCalendarPath(message.calendarPath).calendarHomeId;
    } catch (err) {
      logger.error('Error while parsing calendar path', err);
    }

    if (!calendarHomeId) {
      return;
    }

    const clientSockets = ioHelper.getUserSocketsFromNamespace(calendarHomeId, io.of(WEBSOCKET.NAMESPACE).sockets) || [];

    _.invokeMap(clientSockets, 'emit', topic, message);
  }

  function parseCalendarPath(calendarPath) {
    // The eventPath is in this form : /calendars/{{calendarHomeId}}/{{calendarId}}.json
    const pathParts = calendarPath.replace(/^\//, '').split('/');

    if (calendarPath.length < 2) {
      return {};
    }

    return {
      calendarHomeId: pathParts[pathParts.length - 2],
      calendarId: pathParts[pathParts.length - 1].replace(/\.json$/, '')
    };
  }
};
