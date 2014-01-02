'use strict';

var express = require('express');
var logger = require('../core').logger;
var serverApplication = express();

var webserver = {
  application: serverApplication,
  server: null,
  port: null,
  started: false
};

exports = module.exports = webserver;


function start(port, virtualhosts, callback) {
  if (arguments.length === 0) {
    logger.error('The webserver start method should receive at least one argument: the webserver port');
    process.exit(1);
  } else if (arguments.length === 1) {
    virtualhosts = [];
  } else if (arguments.length === 2) {
    callback = virtualhosts;
    virtualhosts = [];
  }

  callback = callback || function() {};

  if (webserver.started) {
    return callback();
  }
  webserver.started = true;

  webserver.port = port;

  if (virtualhosts.length) {
    var application = express();
    virtualhosts.forEach(function(hostname) {
      application.use(express.vhost(hostname, serverApplication));
    });
    webserver.application = application;
  }

  function listenCallback(err) {
    webserver.server.removeListener('listening', listenCallback);
    webserver.server.removeListener('error', listenCallback);
    callback(err);
  }

  webserver.server = webserver.application.listen(webserver.port);
  webserver.server.on('listening', listenCallback);
  webserver.server.on('error', listenCallback);
}

webserver.start = start;
