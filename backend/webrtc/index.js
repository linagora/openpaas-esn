'use strict';

var easyrtc = require('easyrtc');

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

  var options = {};

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
