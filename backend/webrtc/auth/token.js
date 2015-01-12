'use strict';
var socketioHelper = require('../../wsserver/helper/socketio');

module.exports = function(socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next) {
  var userId = socketioHelper.getUserId(socket);
  if (!userId) {
    next(new Error('Websocket not authenticated'));
  } else {
    next(null);
  }
};
