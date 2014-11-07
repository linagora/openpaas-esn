'use strict';

var async = require('async');
var moduleManager = require('./backend/module-manager');
var core = require('./backend/core');
var logger = core.logger;

moduleManager.manager.registerState('deploy', ['lib']);
moduleManager.manager.registerState('start', ['lib', 'deploy']);

moduleManager.setupManager();
moduleManager.manager.registerModule(require('./backend/webserver/webserver-wrapper'), true);
moduleManager.manager.registerModule(require('./backend/webserver').awesomeWebServer, true);
moduleManager.manager.registerModule(require('./backend/wsserver').awesomeWsServer, true);
moduleManager.manager.registerModule(require('./backend/webrtc').awesomeWebRTCServer, true);

core.init();

logger.info('OpenPaaS Core bootstraped, configured in %s mode', process.env.NODE_ENV);

function startESN(callback) {
  moduleManager.manager.fire('start', [
    'linagora.esn.core.webserver',
    'linagora.esn.core.wsserver',
    'linagora.esn.core.webrtcserver'
  ]).then(function() {
    callback(null);
  }, function(err) {
    callback(err);
  });
}

async.series([core.templates.inject, startESN], function(err) {
  if (err) {
    logger.error('Fatal error:', err);
    if (err.stack) {
      logger.error(err.stack);
    }
    process.exit(1);
  }
  logger.info('OpenPaas ESN is now started on node %s', process.version);
});
