'use strict';

var Path = require('path');
var fs = require('fs');
var core = require('../core');
var AwesomeModuleManager = require('awesome-module-manager');
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var ESN_MODULE_PREFIX = 'linagora.esn.core.';

var manager = new AwesomeModuleManager(core.logger);

function mockModule(name, lib) {
  var mock = new AwesomeModule(ESN_MODULE_PREFIX + name, {
    lib: function(deps, callback) {
      return callback(null, lib);
    }
  });
  var loader = manager.loaders.code(mock);
  manager.appendLoader(loader);
}

function mockCoreModule(name) {
  var mock = new AwesomeModule(ESN_MODULE_PREFIX + name, {
    lib: function(deps, callback) {
      return callback(null, core[name]);
    }
  });
  var loader = manager.loaders.code(mock);
  manager.appendLoader(loader);
}

function mockCore() {
  var corePath = Path.join(__dirname, '..', 'core');
  fs.readdirSync(corePath).forEach(function(filename) {
    var modPath = Path.join(corePath, filename);
    var stat = fs.statSync(modPath);
    if (!stat.isDirectory()) { return; }
    mockCoreModule(filename);
  });
}

function mockESNApplication() {
  var application = new AwesomeModule(ESN_MODULE_PREFIX + 'esn', {
    dependencies: [
      new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.servers.config', 'conf'),
      new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver', 'webserver'),
      new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
      new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webrtcserver', 'webrtcserver')
    ],
    lib: function(dependencies, callback) {
      return callback(null, { started: false });
    },
    start: function(dependencies, callback) {
      this.started = true;
      core.logger.info('OpenPaas ESN is now started on node %s', process.version);
      callback();
    }
  });
  var loader = manager.loaders.code(application);
  manager.appendLoader(loader);
}

function setupManager() {
  mockCore();
  mockESNApplication();
  core.moduleManager = manager;
  return manager;
}

module.exports.setupManager = setupManager;
module.exports.ESN_MODULE_PREFIX = ESN_MODULE_PREFIX;
module.exports.manager = manager;
module.exports.mockModule = mockModule;
