'use strict';

const _ = require('lodash');
const WEBSOCKET = require('../../lib/constants').WEBSOCKET;

module.exports = dependencies => {
  const io = dependencies('wsserver').io;
  const ioHelper = dependencies('wsserver').ioHelper;

  return {
    notify
  };

  function notify(topic, message) {
    const userId = parseCalendarPath(message.calendarPath).calendarHomeId;

    if (!userId) {
      return;
    }

    const clientSockets = ioHelper.getUserSocketsFromNamespace(userId, io.of(WEBSOCKET.NAMESPACE).sockets) || [];

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
