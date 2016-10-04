'use strict';

var path = require('path');

module.exports = function setupServer(moduleManager) {
  var modulesPath = path.normalize(
    path.join(__dirname, '../../modules')
  );
  var pluginsPath = path.normalize(
    path.join(__dirname, '../../apps')
  );
  var nodeModulesPath = path.normalize(
    path.join(__dirname, '../../node_modules/')
  );

  moduleManager.manager.registerState('deploy', ['lib']);
  moduleManager.manager.registerState('start', ['lib', 'deploy']);

  moduleManager.setupManager();

  var trustedModulesLoader = moduleManager.manager.loaders.filesystem(modulesPath, true);
  moduleManager.manager.appendLoader(trustedModulesLoader);

  var untrustedModulesLoader = moduleManager.manager.loaders.filesystem(pluginsPath, false);
  moduleManager.manager.appendLoader(untrustedModulesLoader);

  var nodeModules = moduleManager.manager.loaders.filesystem(nodeModulesPath, true);
  moduleManager.manager.appendLoader(nodeModules);

  moduleManager.manager.registerModule(require('../webserver/webserver-wrapper'), true);
  moduleManager.manager.registerModule(require('../webserver').awesomeWebServer, true);
  moduleManager.manager.registerModule(require('../wsserver').awesomeWsServer, true);
};
