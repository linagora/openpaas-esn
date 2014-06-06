'use strict';

var easyrtc = require('easyrtc');
var config = require('../core').config('default');

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

  easyrtc.listen(webserver, wsserver, options, function(err, pub) {
    if (err) {
      return callback(err);
    }
    server.pub = pub;
    server.started = true;
    return callback();
  });
};
server.start = start;
