'use strict';

var express = require('express');
var logger = require('../core').logger;
var serverApplication = require('./application');
var https = require('https');
var http = require('http');
var fs = require('fs');

var webserver = {
  application: serverApplication,
  virtualhosts: [],
  server: null,
  port: null,
  ip: null,
  ssl_port: null,
  ssl_key: null,
  ssl_cert: null,
  ssl_ip: null,
  started: false
};

exports = module.exports = webserver;


function start(callback) {
  if (!webserver.port && !webserver.ssl_port) {
    logger.error('The webserver needs to be configured before it is started');
    process.exit(1);
  }
  if (webserver.ssl_port && (!webserver.ssl_cert || !webserver.ssl_key)) {
    logger.error('Configuring an SSL server requires port, certificate and key');
    process.exit(1);
  }
  callback = callback || function() {};

  if (webserver.started) {
    return callback();
  }
  webserver.started = true;

  if (webserver.virtualhosts.length) {
    var application = express();
    webserver.virtualhosts.forEach(function(hostname) {
      application.use(express.vhost(hostname, serverApplication));
    });
    webserver.application = application;
  }

  var serverListening = false;
  var sslserverListening = false;
  var callbackFired = false;

  function listenCallback(server, err) {
    if (server === webserver.server) {
      serverListening = true;
    }
    if (server === webserver.sslserver) {
      sslserverListening = true;
    }
    server.removeListener('listening', listenCallback);
    server.removeListener('error', listenCallback);

    // If an error occurred or both servers are listening, call the callback
    if (!callbackFired && (err || (serverListening && sslserverListening))) {
      callbackFired = true;
      callback(err);
    }
  }

  function setupEventListeners(server) {
    server.on('listening', listenCallback.bind(null, server));
    server.on('error', listenCallback.bind(null, webserver.server));
  }

  if (webserver.ssl_key && webserver.ssl_cert && webserver.ssl_port) {
    var sslkey = fs.readFileSync(webserver.ssl_key);
    var sslcert = fs.readFileSync(webserver.ssl_cert);
    webserver.sslserver = https.createServer({key: sslkey, cert: sslcert}, webserver.application).listen(webserver.ssl_port, webserver.ssl_ip);
    setupEventListeners(webserver.sslserver);
  } else {
    sslserverListening = true;
  }

  if (webserver.port) {
    webserver.server = http.createServer(webserver.application).listen(webserver.port, webserver.ip);
    setupEventListeners(webserver.server);
  } else {
    serverListening = true;
  }
}

webserver.start = start;
