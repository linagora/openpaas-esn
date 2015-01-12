'use strict';
var store = require('../socketstore');

function getUserSocketsFromNamespace(userId, nsSockets) {
  var userSockets = store.getSocketsForUser(userId);
  var namespaceSocketIds = {};
  nsSockets.forEach(function(socket) {
    namespaceSocketIds[socket.id] = socket;
  });
  var nsUserSockets = userSockets.filter(function(socket) {
    return (socket.id in namespaceSocketIds);
  })
  .map(function(socket) {
    return namespaceSocketIds[socket.id];
  });
  return nsUserSockets;
}

function getInfos(socket) {
  if (!socket || !socket.request) {
    return null;
  }
  var request = socket.request,
      remoteAddress, remotePort;
  if (request.client && request.client._peername) {
    remoteAddress = request.client._peername.address;
    remotePort = request.client._peername.port;
  }
  return {
    userId: request.userId,
    query: request._query,
    headers: request.headers,
    remoteAddress: remoteAddress,
    remotePort: remotePort
  };
}

function setUserId(socket, userId) {
  socket.request.userId = userId;
}

function getUserId(socket) {
  if (!socket.request) {
    return null;
  }
  return socket.request.userId;
}

module.exports.getUserSocketsFromNamespace = getUserSocketsFromNamespace;
module.exports.getInfos = getInfos;
module.exports.setUserId = setUserId;
module.exports.getUserId = getUserId;
