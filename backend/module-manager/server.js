'use strict';

var path = require('path');

module.exports = function setupServer(moduleManager) {
  var modulePath = path.normalize(
    path.join(__dirname, '../../modules')
  );

  moduleManager.manager.registerState('deploy', ['lib']);
  moduleManager.manager.registerState('start', ['lib', 'deploy']);

  moduleManager.setupManager();

  var trustedModulesLoader = moduleManager.manager.loaders.filesystem(modulePath, true);
  moduleManager.manager.appendLoader(trustedModulesLoader);
  moduleManager.manager.registerModule(require('../webserver/webserver-wrapper'), true);
  moduleManager.manager.registerModule(require('../webserver').awesomeWebServer, true);
  moduleManager.manager.registerModule(require('../wsserver').awesomeWsServer, true);
  moduleManager.manager.registerModule(require('../webrtc').awesomeWebRTCServer, true);
};
