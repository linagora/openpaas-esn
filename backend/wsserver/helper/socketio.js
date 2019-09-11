const store = require('../socketstore');

module.exports = {
  getUserSocketsFromNamespace,
  getInfos,
  setUserId,
  getUserId
};

function getUserSocketsFromNamespace(userId, nsSockets) {
  const userSockets = store.getSocketsForUser(userId);
  const namespaceSocketIds = {};

  Object.values(nsSockets).forEach(function(socket) {
    namespaceSocketIds[socket.conn.id] = socket;
  });

  const nsUserSockets = userSockets.filter(function(socket) {
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

  const request = socket.request;
  let remoteAddress, remotePort;

  if (request.client && request.client._peername) {
    remoteAddress = request.client._peername.address;
    remotePort = request.client._peername.port;
  }

  return {
    userId: request.userId,
    query: request._query,
    headers: request.headers,
    remoteAddress,
    remotePort
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
