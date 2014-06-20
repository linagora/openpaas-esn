'use strict';
var logger = require('../core/logger');

var websockets = {};

function registerSocket(socket, userId) {
  if (!userId || !userId.length) {
    var err = new Error('SocketStore: refusing to store a socket without an associated user ID');
    logger.error('SocketStore: refusing to store a socket without an associated user ID');
    logger.debug(new Error().stack);
    throw err;
  }
  websockets[userId] = websockets[userId] || [];
  websockets[userId].push(socket);
  socket.userId = userId;
}
module.exports.registerSocket = registerSocket;

function unregisterSocket(socket) {
  var userId = socket.userId;
  if (! (userId in websockets)) {
    logger.warn('Weird: try to unregister socket for user ' + userId + ', and this user have no socket');
    return;
  }
  var index = null;
  websockets[userId].every(function(s, i) {
    if (s.id === socket.id) {
      index = i;
      return false;
    }
    return true;
  });
  if (index === null) {
    logger.warn('socket id ' + socket.id + ' not found for user id ' + userId);
    return;
  }
  websockets[userId].splice(index, 1);
}
module.exports.unregisterSocket = unregisterSocket;

function getSocketsForUser(userId) {
  if (! (userId in websockets)) {
    return [];
  }
  return websockets[userId].slice();
}
module.exports.getSocketsForUser = getSocketsForUser;
