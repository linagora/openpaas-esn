'use strict';

const _ = require('lodash');
const WEBSOCKET = require('../../lib/constants').WEBSOCKET;

module.exports = dependencies => {
  const io = dependencies('wsserver').io;
  const ioHelper = dependencies('wsserver').ioHelper;

  return {
    notify
  };

  function notify(topic, msg) {
    const userIds = [parseEventPath(msg.eventPath).userId];

    if (msg.shareeIds) {
      msg.shareeIds.forEach(shareePrincipals => userIds.push(parseUserPrincipal(shareePrincipals)));
    }

    delete msg.shareeIds;

    userIds.forEach(userId => {
      const clientSockets = ioHelper.getUserSocketsFromNamespace(userId, io.of(WEBSOCKET.NAMESPACE).sockets) || [];

      _.invokeMap(clientSockets, 'emit', topic, msg);
    });
  }

  function parseEventPath(eventPath) {
    // The eventPath is in this form : /calendars/{{userId}}/{{calendarId}}/{{eventUid}}.ics
    const pathParts = eventPath.replace(/^\//, '').split('/');

    return {
      userId: pathParts[1],
      calendarId: pathParts[2],
      eventUid: pathParts[3].replace(/\.ics$/, '')
    };
  }

  function parseUserPrincipal(userPrincipal) {
    // The userPrincipal is in this form : principals/users/{{userId}}
    const pathParts = userPrincipal.split('/');

    return pathParts[2];
  }
};
