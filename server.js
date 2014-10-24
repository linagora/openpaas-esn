var async = require('async');
var moduleManagerModule = require('./backend/module-manager');

function startWebServer(callback) {
  if ( !config.webserver.enabled ) {
    return callback();
  }

  var webserver = require('./backend/webserver');
  moduleManagerModule.mockModule('webserver', webserver);
  webserver.virtualhosts = config.webserver.virtualhosts;
  webserver.port = config.webserver.port;
  webserver.ip = config.webserver.ip;
  webserver.ssl_port = config.webserver.ssl_port;
  webserver.ssl_ip = config.webserver.ssl_ip;
  webserver.ssl_key = config.webserver.ssl_key;
  webserver.ssl_cert = config.webserver.ssl_cert;

  webserver.start(function(err) {
    if ( err ) {
      logger.error('Web server failed to start', err);
      if ( err.syscall === 'listen' && err.code === 'EADDRINUSE' ) {
        logger.info('Something is already listening on the Web server port', config.webserver.port);
      }
    }
    callback.apply(this,arguments);
  });
};

function startWsServer(callback) {
  if ( !config.wsserver.enabled ) {
    return callback();
  }

  var server = require('./backend/wsserver');
  moduleManagerModule.mockModule('wsserver', server);

  server.start(config.wsserver.port, config.wsserver.options, function(err) {
    if ( err ) {
      logger.error('websocket server failed to start', err);
    }
    callback.apply(this,arguments);
  });
};

function startWebRTCServer(callback) {
  if (!config.webrtc.enabled) {
    return callback();
  }
  if (!config.wsserver.enabled || !config.webserver.enabled) {
    logger.warn('WebRTC server can not be started when Websocket and Web server are not activated');
    return callback();
  }

  var webserver = require('./backend/webserver').application;
  var wsserver = require('./backend/wsserver').io;

  if (!webserver || !wsserver) {
    logger.warn('WebRTC server can not be started without webserver and websocket server instances');
    return callback();
  }

  var server = require('./backend/webrtc');
  moduleManagerModule.mockModule('webrtcserver', server);
  server.start(webserver, wsserver, function(err) {
    if ( err ) {
      logger.warn('webrtc server failed to start', err);
    }
    callback.apply(this, arguments);
  });
};

var core = require('./backend/core');
moduleManagerModule.setupManager();
core.init();
var config = core.config('default');
var logger = core.logger;
logger.info('OpenPaaS Core bootstraped, configured in %s mode', process.env.NODE_ENV);

async.series([core.templates.inject, startWebServer, startWsServer, startWebRTCServer], function(err) {
  if ( err ) {
    logger.error('Fatal error:', err);
    if ( err.stack ) {
      logger.error(err.stack);
    }
    process.exit(1);
  }
  logger.info('OpenPaas ESN is now started on node %s', process.version);
});
