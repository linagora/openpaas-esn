'use strict';

const _ = require('lodash');
const Q = require('q');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const wsserver = dependencies('wsserver');

  return {
    updateLastActiveFromWebsocketConnections
  };

  function updateLastActiveFromWebsocketConnections() {
    const connectedSockets = _.filter(wsserver.io.sockets.sockets, 'connected');
    const uniqueUserIds = _.uniqBy(connectedSockets, wsserver.ioHelper.getUserId).map(wsserver.ioHelper.getUserId);

    logger.debug(`Users currently connected ${uniqueUserIds}`);
    if (!uniqueUserIds || !uniqueUserIds.length) {
      return Q();
    }

    return lib.userStatus.updateLastActiveForUsers(uniqueUserIds);
  }
};
