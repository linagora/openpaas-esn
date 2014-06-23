'use strict';
var store = require('../socketstore');

function getUserSocketsFromNamespace(userId, nsSockets) {
  var userSockets = store.getSocketsForUser(userId);
  var nsUserSockets = userSockets.filter(function(socket) {
    return (socket.id in nsSockets);
  })
  .map(function(socket) {
    return nsSockets[socket.id];
  });
  return nsUserSockets;
}
module.exports.getUserSocketsFromNamespace = getUserSocketsFromNamespace;
