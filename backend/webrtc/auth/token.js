'use strict';

module.exports = function(socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next) {
  if (!socket.userId) {
    next(new Error('Websocket not authenticated'));
  } else {
    next(null);
  }
};
