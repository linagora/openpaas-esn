'use strict';

var easyrtc = require('easyrtc');
var config = require('../core').config('default');
var conference = require('../core/conference');
var logger = require('../core/logger');

var server = {
  started: false,
  pub: null
};
exports = module.exports = server;

var start = function(webserver, wsserver, callback) {

  if (server.started) {
    return callback();
  }

  if (!webserver || !wsserver) {
    return callback(new Error('Webserver and Websocket server are required'));
  }

  var options = {
    logLevel: config.webrtc.level ||  'info',
    appDefaultName: 'OpenPaasRSE',
    demosEnable: false
  };

  var onAuthenticate = require('./auth/token');
  easyrtc.events.on('authenticate', onAuthenticate);

  easyrtc.events.on('disconnect', function() {
    logger.debug('EasyRTC Disconnect');
  });

  easyrtc.listen(webserver, wsserver, options, function(err, pub) {
    if (err) {
      return callback(err);
    }
    server.pub = pub;
    server.started = true;

    var connect = pub.events.defaultListeners.connection;
    var disconnect = pub.events.defaultListeners.disconnect;
    var roomJoin = pub.events.defaultListeners.roomJoin;
    var roomLeave = pub.events.defaultListeners.roomLeave;
    var roomCreate = pub.events.defaultListeners.roomCreate;

    easyrtc.events.on('roomCreate', function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
      logger.debug('EasyRTC Room create ' + roomName);
      return roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });

    easyrtc.events.on('connection', function(socket, easyrtcid, next) {
      logger.debug('EasyRTC Connection ' + easyrtcid);
      return connect(socket, easyrtcid, next);
    });

    easyrtc.events.on('disconnect', function(connectionObj, next) {
      logger.debug('EasyRTC disconnect from user ' + connectionObj.getUsername());
      return disconnect(connectionObj, next);
    });

    easyrtc.events.on('roomJoin', function(connectionObj, roomName, roomParameter, callback) {
      logger.debug('EasyRTC User ' + connectionObj.getUsername() + ' is joining room ' + roomName);
      conference.join(roomName, connectionObj.getUsername(), function(err) {
        if (err) {
          logger.error('EasyRTC ERROR While joining the room ' + roomName, err);
        }
        return roomJoin(connectionObj, roomName, roomParameter, callback);
      });
    });

    easyrtc.events.on('roomLeave', function(connectionObj, roomName, next) {
      conference.leave(roomName, connectionObj.getUsername(), function(err) {
        if (err) {
          logger.error('EasyRTC ERROR While leaving the room ' + roomName, err);
        }
        return roomLeave(connectionObj, roomName, next);
      });
    });

    return callback();
  });
};
server.start = start;
